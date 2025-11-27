import express from "express";
import { config } from "./src/config";
import powerbiRoutes from "./src/routes/powerBI.routes";
import sharePointRoutes from "./src/routes/sharepoint.routes";
import dashboardRoutes from "./src/routes/dashboard.routes";
import cors from "cors";
import {
  setLeadListId,
  setPostListId,
  setPromptListId,
} from "./src/constants/store";
import { getADAccessToken } from "./src/services/auth.service";
import {
  getListIdByName,
  getSiteIdByName,
} from "./src/services/sharepoint.service";
import {
  LinkedInService,
  ReplyToCommentRequest,
} from "./src/services/linkedin.service";
import { createProducer } from "./src/kafka/producer";

const app = express();
app.use(cors());
app.use(express.json());

// getADAccessToken()
//   .then(async (token) => {
//     console.log("✅ Azure AD Access Token retrieved");
//     console.log("Server is starting....");

//     const promptListId = await getListIdByName("Prompt");
//     setPromptListId(promptListId);

//     const postListId = await getListIdByName("Post");
//     setPostListId(postListId);

//     const leadListId = await getListIdByName("Leads");
//     setLeadListId(leadListId);

//     app.listen(config.port, () => {
//       console.log(`Server running on port ${config.port}`);
//     });
//   })
//   .catch((error) => {
//     console.error("Failed to retrieve Azure AD Access Token:", error);
//     process.exit(1);
//   });

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
app.use("/api/powerbi", powerbiRoutes);
app.use("/api/sp", sharePointRoutes);
app.use("/api/dashboard", dashboardRoutes);

interface AnalyticsResult {
  success: boolean;
  postUrn: string;
  analytics?: {
    tag: string;
    likes: number;
    comments: number;
    emails: string[];
    impressions: number;
    shares: number;
  };
  error?: string;
}

interface BatchAnalyticsResponse {
  successfulResults: AnalyticsResult[];
  failedResults: AnalyticsResult[];
  totalProcessed: number;
}

// "urn:li:activity:7394266508098682880"

const ACCESS_TOKEN = config.orgLinkedInAccessToken;
const ORGANIZATION_ID = config.orgLinkedInOrgId || "109439350";
// const POST_URNS = ["urn:li:activity:7396172492517629952"];
const POST_URNS = ["urn:li:activity:7396172492517629952"];

// Test function to check what posts we can access
async function testAccess(): Promise<void> {
  const service = new LinkedInService(ACCESS_TOKEN);

  console.log("\n🧪 Testing LinkedIn API Access...");
  console.log("=".repeat(50));

  // First, try to get organization ID automatically
  let detectedOrgId = await service.getOrganizationId();

  // Use detected ID or fallback to config
  const orgIdToUse = detectedOrgId || ORGANIZATION_ID;
  console.log(`\n📊 Using Organization ID: ${orgIdToUse}`);

  // Check what posts are accessible
  const accessiblePosts = await service.listAccessiblePosts(orgIdToUse);
  console.log(`\n📊 Total accessible posts: ${accessiblePosts.length}`);

  if (accessiblePosts.length > 0) {
    console.log("\n📋 Recent accessible post IDs:");
    accessiblePosts.slice(0, 10).forEach((post, index) => {
      const postId = post.id || post.activity || "Unknown";
      console.log(`   ${index + 1}. ${postId}`);
    });

    console.log("\n💡 Try using one of these post IDs in your POST_URNS array");
  } else {
    console.log("\n⚠️  No accessible posts found. This might indicate:");
    console.log("   - Wrong organization ID");
    console.log("   - Posts are from personal profile, not organization");
    console.log("   - Different permission scope needed");
  }

  console.log("=".repeat(50));
}

async function runBatchAnalytics(): Promise<
  BatchAnalyticsResponse | undefined
> {
  const service = new LinkedInService(ACCESS_TOKEN);

  try {
    // Method 1: Concurrent execution (faster)
    const analyticsPromises: Promise<AnalyticsResult>[] = POST_URNS.map(
      async (postUrn: string): Promise<AnalyticsResult> => {
        try {
          // Get complete post data including content and analytics
          const completeData = await service.getCompletePostData(
            postUrn,
            ORGANIZATION_ID
          );

          console.log(`✅ Complete data fetched for ${postUrn}`);
          console.log(
            `📊 Post content:`,
            completeData.postContent?.text?.text ||
              completeData.postContent?.text ||
              "No content"
          );

          return {
            success: true,
            postUrn,
            analytics: completeData.analytics,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          console.log(`❌ Failed to fetch data for ${postUrn}:`, errorMessage);
          return {
            success: false,
            postUrn,
            error: errorMessage,
          };
        }
      }
    );

    const results: AnalyticsResult[] = await Promise.all(analyticsPromises);

    const successful: AnalyticsResult[] = results.filter(
      (r): r is AnalyticsResult => r.success
    );
    const failed: AnalyticsResult[] = results.filter(
      (r): r is AnalyticsResult => !r.success
    );

    console.log(`✅ Successfully fetched data for ${successful.length} posts`);
    console.log(`❌ Failed to fetch data for ${failed.length} posts`);

    successful.forEach((result: AnalyticsResult) => {
      console.log("COMPLETE ANALYTICS:", result.analytics);
    });

    return {
      successfulResults: successful,
      failedResults: failed,
      totalProcessed: results.length,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown batch analytics error";
    console.error("Batch analytics error:", errorMessage);
    return undefined;
  }
}

// Run access test first, then analytics
// async function main() {
//   await testAccess();
//   console.log('\n🚀 Running analytics on specified posts...');
//   const result = await runBatchAnalytics();
//   console.log('\n✅ Analytics complete!');
// }

async function main() {
  const service = new LinkedInService(ACCESS_TOKEN);

  console.log("\n🧪 Testing LinkedIn API Access...");
  console.log("=".repeat(50));

  // Test basic access first
  await service.testBasicAccess();

  console.log("\n🚀 Running simplified analytics...");
  console.log("=".repeat(50));

  // Use simplified analytics approach
  for (const postUrn of POST_URNS) {
    try {
      const analytics = await service.getPostAnalyticsSimple(postUrn);
      console.log("\n📊 ANALYTICS RESULT:");
      console.log(JSON.stringify(analytics, null, 2));

      if (analytics.likes > 0 || analytics.comments > 0) {
        console.log("✅ Successfully retrieved engagement data!");
      } else {
        console.log(
          "⚠️ No engagement data found - post might be private or non-existent"
        );
      }
    } catch (error: any) {
      console.log(`❌ Failed to get analytics for ${postUrn}:`, error.message);
    }
  }

  console.log("\n✅ Analysis complete!");
}

// main().catch(console.error);

// async function run() {
//   const service = new LinkedInService(ACCESS_TOKEN);

//   const analytics = await service.getPostAnalytics(POST_URN);

//   console.log("FINAL ANALYTICS:", analytics);
// }

// run();

// "urn:li:ugcPost:7396172490676428800" (ad post)
// "urn:li:activity:7397623832259272704"
// "urn:li:share:7392518501514559488"
const runApp = async () => {
  const service = new LinkedInService(ACCESS_TOKEN);
  const postUrn = "urn:li:activity:7397626090426552320";
  // const results = await service.getActivityPostAnalytics(
  //   "urn:li:share:7392518501514559488"
  // );

  // reply comments
  // const comments: { count: number; comments: any[] } =
  //   await service.getPostComments("urn:li:activity:7397252229327568896");
  // console.log("Comments:", JSON.stringify(comments, null, 2));
  await service.getPersonUrn();

  // const postUrnType = postUrn.split(":")[2];
  // const postUrnId = postUrn.split(":").pop();
  // // const parentCommentUrn = `urn:li:comment:(${postUrn},7397625105830506496)`;
  // const parentCommentUrn = `urn:li:comment:(urn:li:${postUrnType}:${postUrnId},${comments.comments[0]["id"]})`;

  // // const commentUrn = comments.comments[0]["$URN"];
  // const commentText = "Hey there! Thank you for sharing your email. We'll be in touch soon!";

  // const params: ReplyToCommentRequest = {
  //   postActivityUrn: comments.comments[0]["object"],
  //   parentCommentUrn: parentCommentUrn,
  //   actorPersonUrn: config.linkedInUrnId,
  //   replyText: commentText,
  // };

  // console.log("Reply Params:", JSON.stringify(params, null, 2));
  // const reply = await service.replyToLinkedInComment(params);

  // console.log("Results:", JSON.stringify(reply, null, 2));
};
runApp().catch((err) => console.error(err.message));

const kafkaMessage = {
  "postActivityUrn": "urn:li:activity:7397252229327568896",
  "parentCommentUrn": "urn:li:comment:(urn:li:activity:7397252229327568896,7397298350691319808)",
  "replyText": "Hey there! Thanks for the comment. We'll be in touch soon! (AI Generated)",
}

// createProducer(kafkaMessage)
//   .then(() => {
//     console.log("✅ Producer disconnected");
//   })
//   .catch((error) => {
//     console.error("❌ Error in producer:", error);
//     process.exit(1);
//   });
