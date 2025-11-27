import axios from "axios";
import { config } from "dotenv";

interface LinkedInComment {
  message?: {
    text?: string;
  };
}

interface LinkedInResponse {
  elements?: any[];
  paging?: {
    total?: number;
  };
}

interface OrganizationAnalytics {
  elements?: {
    totalShareStatistics?: {
      shareCount?: number;
      commentCount?: number;
      likeCount?: number;
      impressionCount?: number;
      clickCount?: number;
    };
  }[];
}

export interface ReplyToCommentRequest {
  postActivityUrn: string; // e.g. "urn:li:activity:6631349431612559360"
  parentCommentUrn: string; // e.g. "urn:li:comment:(urn:li:activity:...,6636062862760562688)"
  actorPersonUrn: string; // e.g. "urn:li:person:A8xe03Qt10"
  replyText: string;
  apiVersion?: string; // e.g. "202511"
}

interface CommentReplyRequest {
  actor: string; // Your person URN (urn:li:person:YOUR_ID)
  message: {
    text: string;
  };
  parentComment: string; // URN of the comment you're replying to
}

export class LinkedInService {
  private accessToken: string;
  private headers: Record<string, string>;

  constructor(accessToken: string) {
    this.accessToken = accessToken;

    this.headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "LinkedIn-Version": "202401",
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }

  encodeUrn(urn: string): string {
    return encodeURIComponent(urn);
  }

  async getPostComments(
    postUrn: string,
    start: number = 0,
    count: number = 50
  ): Promise<{ count: number; comments: LinkedInComment[] }> {
    const encoded = this.encodeUrn(postUrn);
    const url = `https://api.linkedin.com/v2/socialActions/${encoded}/comments`;

    let allComments: LinkedInComment[] = [];
    let currentStart = start;

    while (true) {
      const params = { start: currentStart, count };

      const resp = await axios.get<LinkedInResponse>(url, {
        headers: this.headers,
        params,
      });

      if (resp.status !== 200) {
        console.log("Error fetching comments:", resp.status, resp.data);
        break;
      }

      const elements = resp.data?.elements || [];
      allComments.push(...elements);

      const paging = resp.data?.paging || {};
      const total = paging.total;

      if (!total || currentStart + count >= total) break;

      currentStart += count;
    }

    return { count: allComments.length, comments: allComments };
  }

  async getPostReactions(
    postUrn: string,
    start: number = 0,
    count: number = 50
  ): Promise<number> {
    const encoded = this.encodeUrn(postUrn);
    // const url = `https://api.linkedin.com/v2/socialActions/${encoded}/likes`;
    const url = `https://api.linkedin.com/rest/reactions?root=${encoded}`;

    let allLikes: any[] = [];
    let currentStart = start;

    while (true) {
      const params = { start: currentStart, count };

      const resp = await axios.get<LinkedInResponse>(url, {
        headers: this.headers,
        params,
      });

      if (resp.status !== 200) {
        console.log("Error fetching likes:", resp.status, resp.data);
        break;
      }

      console.log("Response from getPostReactions:", resp.data);

      const elements = resp.data?.elements || [];
      allLikes.push(...elements);

      const paging = resp.data?.paging || {};
      const total = paging.total;

      if (!total || currentStart + count >= total) break;

      currentStart += count;
    }
    return allLikes.length;
  }

  async getOrganizationId(): Promise<string | null> {
    try {
      console.log("🔍 Searching for your organization ID...");

      // Method 1: Get organizations you admin
      const url1 = `https://api.linkedin.com/v2/organizationAcls`;
      const response1 = await axios.get(url1, {
        headers: this.headers,
        params: {
          q: "roleAssignee",
          role: "ADMINISTRATOR",
          projection: "(elements*~(organizationalTarget~(id,localizedName)))",
        },
      });

      if (response1.data?.elements?.length > 0) {
        const org = response1.data.elements[0];
        const orgId = org.organizationalTarget?.id?.split(":").pop();
        const orgName = org.organizationalTarget?.localizedName;

        console.log(`✅ Found admin organization: ${orgName} (ID: ${orgId})`);
        return orgId;
      }
    } catch (error1) {
      console.log("Organization admin check failed, trying alternative...");
    }

    try {
      // Method 2: Get organizations you can post to
      const url2 = `https://api.linkedin.com/v2/organizations`;
      const response2 = await axios.get(url2, {
        headers: this.headers,
        params: {
          q: "administeredOrganization",
          count: 10,
        },
      });

      if (response2.data?.elements?.length > 0) {
        const org = response2.data.elements[0];
        const orgId = org.id?.split(":").pop();
        const orgName = org.name?.localized?.en_US || "Unknown";

        console.log(`✅ Found organization: ${orgName} (ID: ${orgId})`);
        return orgId;
      }
    } catch (error2) {
      console.log("Alternative organization lookup failed");
    }

    try {
      // Method 3: Check your profile for current company
      const url3 = `https://api.linkedin.com/v2/people/(id~)`;
      const response3 = await axios.get(url3, {
        headers: this.headers,
        params: {
          projection: "(id,firstName,lastName,positions)",
        },
      });

      if (response3.data?.positions?.elements?.length > 0) {
        const currentPosition = response3.data.positions.elements[0];
        if (currentPosition.company) {
          const orgId = currentPosition.company.split(":").pop();
          console.log(`✅ Found organization from profile: ${orgId}`);
          return orgId;
        }
      }
    } catch (error3) {
      console.log("Profile organization lookup failed");
    }

    console.log("❌ Could not automatically detect organization ID");
    console.log("💡 Manual methods to find your organization ID:");
    console.log("   1. Go to your LinkedIn company page");
    console.log(
      "   2. Look at the URL: linkedin.com/company/YOUR-COMPANY-NAME/"
    );
    console.log(
      "   3. Or use LinkedIn Developer Console to find your organization"
    );

    return null;
  }

  async listAccessiblePosts(organizationId?: string): Promise<any[]> {
    const accessiblePosts: any[] = [];

    try {
      // Method 1: Get organization posts
      if (organizationId) {
        console.log(
          `🔍 Checking organization posts for org: ${organizationId}`
        );
        const url1 = `https://api.linkedin.com/v2/shares`;
        const response1 = await axios.get(url1, {
          headers: this.headers,
          params: {
            q: "owners",
            owners: [`urn:li:organization:${organizationId}`],
            count: 50,
          },
        });

        if (response1.data?.elements) {
          console.log(
            `📋 Found ${response1.data.elements.length} organization posts`
          );
          accessiblePosts.push(...response1.data.elements);

          // Log the first few post IDs for reference
          response1.data.elements
            .slice(0, 5)
            .forEach((post: any, index: number) => {
              console.log(
                `   Post ${index + 1}: ${post.id || post.activity || "No ID"}`
              );
            });
        }
      }

      // Method 2: Get member posts
      try {
        const url2 = `https://api.linkedin.com/v2/shares`;
        const response2 = await axios.get(url2, {
          headers: this.headers,
          params: {
            q: "authors",
            authors: ["urn:li:person:1189276774"], // Your member ID
            count: 20,
          },
        });

        if (response2.data?.elements) {
          console.log(
            `📋 Found ${response2.data.elements.length} member posts`
          );
          accessiblePosts.push(...response2.data.elements);
        }
      } catch (memberError) {
        console.log("Member posts check failed (this is normal)");
      }
    } catch (error) {
      console.error("Error listing accessible posts:", error);
    }

    return accessiblePosts;
  }

  extractEmails(text: string): string[] {
    if (!text) return [];
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(regex) || [];
  }

  async getActivityPost(
    activityUrn: string,
    organizationId?: string
  ): Promise<any> {
    console.log(`🔍 Attempting to fetch post: ${activityUrn}`);

    try {
      // First, check what posts are actually accessible
      const accessiblePosts = await this.listAccessiblePosts(organizationId);
      const activityId = activityUrn.split(":").pop();

      // Look for the post in accessible posts first
      const foundPost = accessiblePosts.find((post: any) => {
        const postStr = JSON.stringify(post).toLowerCase();
        return (
          postStr.includes(activityId || "") ||
          post.id?.includes(activityId) ||
          post.activity?.includes(activityId)
        );
      });

      if (foundPost) {
        console.log("✅ Post found in accessible posts list!");
        return foundPost;
      }

      console.log(
        "⚠️ Post not found in accessible posts, trying direct access..."
      );

      // Method 1: Try the modern posts endpoint
      try {
        const postId = activityUrn.split(":").pop();
        const url1 = `https://api.linkedin.com/rest/posts/${postId}`;

        const response1 = await axios.get(url1, {
          headers: {
            ...this.headers,
            "LinkedIn-Version": "202401",
          },
        });

        console.log("✅ Post fetched via posts endpoint");
        return response1.data;
      } catch (error1: any) {
        console.log(
          "Posts endpoint failed:",
          error1.response?.status,
          error1.response?.data?.message
        );
      }

      // Method 2: Try UGC posts endpoint
      try {
        const postId = activityUrn.split(":").pop();
        const ugcUrn = `urn:li:ugcPost:${postId}`;
        const encoded = this.encodeUrn(ugcUrn);
        const url2 = `https://api.linkedin.com/v2/ugcPosts/${encoded}`;

        const response2 = await axios.get(url2, {
          headers: this.headers,
        });

        console.log("✅ Post fetched via UGC endpoint");
        return response2.data;
      } catch (error2: any) {
        console.log(
          "UGC endpoint failed:",
          error2.response?.status,
          error2.response?.data?.message
        );
      }

      // Method 3: Try activities endpoint
      try {
        const encoded = this.encodeUrn(activityUrn);
        const url3 = `https://api.linkedin.com/v2/activities/${encoded}`;

        const response3 = await axios.get(url3, {
          headers: this.headers,
        });

        console.log("✅ Post fetched via activities endpoint");
        return response3.data;
      } catch (error3: any) {
        console.log(
          "Activities endpoint failed:",
          error3.response?.status,
          error3.response?.data?.message
        );
      }

      // If all direct methods fail, try to get basic info from analytics
      console.log("⚠️ Direct post access failed, creating fallback content...");
      return {
        id: activityUrn,
        text: {
          text: `Post ${activityId} - Content access restricted`,
        },
        contentSource: "fallback",
        note: "Post exists but content is not accessible with current permissions",
      };
    } catch (error: any) {
      console.error("Complete failure in getActivityPost:", error.message);
      throw error;
    }
  }

  async getActivityViaShares(activityUrn: string): Promise<any> {
    try {
      const shareUrn = activityUrn.replace("activity:", "share:");
      const encoded = this.encodeUrn(shareUrn);

      const url = `https://api.linkedin.com/v2/shares/${encoded}`;

      const response = await axios.get(url, {
        headers: this.headers,
      });

      return response.data;
    } catch (error) {
      console.error("Failed to fetch post via shares:", error);
      throw error;
    }
  }

  async getCompletePostData(
    activityUrn: string,
    organizationId?: string
  ): Promise<{
    postContent: any;
    analytics: {
      tag: string;
      likes: number;
      comments: number;
      emails: string[];
      impressions: number;
      shares: number;
    };
  }> {
    try {
      // Pass organizationId to getActivityPost for better access
      const [postResult, analyticsResult] = await Promise.allSettled([
        this.getActivityPost(activityUrn, organizationId),
        this.getPostAnalytics(activityUrn, organizationId),
      ]);

      return {
        postContent:
          postResult.status === "fulfilled"
            ? postResult.value
            : {
                id: activityUrn,
                text: { text: "Content unavailable" },
                error:
                  postResult.status === "rejected"
                    ? postResult.reason?.message
                    : "Unknown error",
              },
        analytics:
          analyticsResult.status === "fulfilled"
            ? analyticsResult.value
            : {
                tag: activityUrn,
                likes: 0,
                comments: 0,
                emails: [],
                impressions: 0,
                shares: 0,
              },
      };
    } catch (error) {
      console.error("Error in getCompletePostData:", error);
      return {
        postContent: {
          id: activityUrn,
          text: { text: "Error fetching content" },
          error: error instanceof Error ? error.message : "Unknown error",
        },
        analytics: {
          tag: activityUrn,
          likes: 0,
          comments: 0,
          emails: [],
          impressions: 0,
          shares: 0,
        },
      };
    }
  }

  async getPostImpressions(
    activityUrn: string,
    organizationId: string
  ): Promise<number> {
    try {
      // With your permissions, try the member post analytics endpoint
      const postId = activityUrn.split(":").pop();

      // Method 1: Member post analytics (you have r_member_postAnalytics)
      const url1 = `https://api.linkedin.com/v2/memberPostAnalytics/${postId}`;
      const response1 = await axios.get(url1, {
        headers: this.headers,
      });

      if (response1.data?.impressions) {
        console.log(
          "✅ Impressions from member analytics:",
          response1.data.impressions
        );
        return response1.data.impressions;
      }
    } catch (error1) {
      console.log("Member analytics failed, trying organization analytics...");

      try {
        // Method 2: Organization analytics (you have rw_organization_admin)
        const shareUrn = activityUrn.replace("activity:", "share:");
        const url2 = `https://api.linkedin.com/v2/organizationalEntityShareStatistics`;

        const response2 = await axios.get(url2, {
          headers: this.headers,
          params: {
            q: "organizationalEntity",
            organizationalEntity: `urn:li:organization:${organizationId}`,
            shares: [shareUrn],
          },
        });

        const stats = response2.data.elements?.[0]?.totalShareStatistics;
        if (stats?.impressionCount) {
          console.log(
            "✅ Impressions from org analytics:",
            stats.impressionCount
          );
          return stats.impressionCount;
        }
      } catch (error2) {
        console.log("Organization analytics failed, trying alternative...");

        try {
          // Method 3: Try direct post statistics
          const postId = activityUrn.split(":").pop();
          const url3 = `https://api.linkedin.com/v2/postStatistics/${postId}`;

          const response3 = await axios.get(url3, {
            headers: this.headers,
          });

          if (response3.data?.impressionCount) {
            console.log(
              "✅ Impressions from post statistics:",
              response3.data.impressionCount
            );
            return response3.data.impressionCount;
          }
        } catch (error3) {
          console.log(
            "All impression methods failed, but you have the right permissions"
          );
        }
      }
    }

    console.log("📊 Impressions not available for this specific post");
    return 0;
  }

  async getPostAnalytics(postUrn: string, organizationId?: string) {
    // Fetch comments
    const { count: commentCount, comments } = await this.getPostComments(
      postUrn
    );

    // Extract emails from comments
    const extractedEmails: string[] = [];
    for (const c of comments) {
      const emailList = this.extractEmails(c?.message?.text || "");
      extractedEmails.push(...emailList);
    }

    // Fetch reactions
    const likes = await this.getPostReactions(postUrn);

    // Now try to get impressions with your full permissions!
    let impressions = 0;
    if (organizationId) {
      impressions = await this.getPostImpressions(postUrn, organizationId);
    }

    return {
      tag: postUrn,
      likes,
      comments: commentCount,
      emails: extractedEmails,
      impressions,
      shares: 0, // Will add shares method next
    };
  }

  async testBasicAccess(): Promise<void> {
    console.log("🧪 Testing Basic LinkedIn API Access...");

    try {
      // Test 1: Basic profile access
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/me",
        {
          headers: this.headers,
        }
      );
      console.log("✅ Profile access: OK");
      console.log(
        `👤 User: ${profileResponse.data.firstName} ${profileResponse.data.lastName}`
      );
    } catch (error) {
      console.log("❌ Profile access: FAILED");
      return;
    }

    try {
      // Test 2: Try to access the specific post directly with Social Actions API
      const postUrn = "urn:li:activity:7397627718021935104";
      const encoded = this.encodeUrn(postUrn);

      // Test likes endpoint
      const likesUrl = `https://api.linkedin.com/v2/socialActions/${encoded}/likes`;
      const likesResponse = await axios.get(likesUrl, {
        headers: this.headers,
        params: { start: 0, count: 1 },
      });

      console.log("✅ Social Actions (likes) access: OK");
      console.log(`👍 Can access post reactions`);
    } catch (error: any) {
      console.log("❌ Social Actions access: FAILED");
      console.log("Error:", error.response?.data || error.message);
    }

    try {
      // Test 3: Try comments endpoint
      const postUrn = "urn:li:activity:7397627718021935104";
      const encoded = this.encodeUrn(postUrn);

      const commentsUrl = `https://api.linkedin.com/v2/socialActions/${encoded}/comments`;
      const commentsResponse = await axios.get(commentsUrl, {
        headers: this.headers,
        params: { start: 0, count: 1 },
      });

      console.log("✅ Social Actions (comments) access: OK");
      console.log(`💬 Can access post comments`);
    } catch (error: any) {
      console.log("❌ Social Actions (comments) access: FAILED");
      console.log("Error:", error.response?.data || error.message);
    }
  }

  // Simplified method that only uses working endpoints
  async getPostAnalyticsSimple(postUrn: string): Promise<{
    tag: string;
    likes: number;
    comments: number;
    emails: string[];
    impressions: number;
    shares: number;
  }> {
    console.log(`🔍 Getting analytics for: ${postUrn}`);

    try {
      // Get comments first
      const { count: commentCount, comments } = await this.getPostComments(
        postUrn
      );
      console.log(`✅ Comments: ${commentCount}`);

      // Extract emails from comments
      const extractedEmails: string[] = [];
      for (const c of comments) {
        const emailList = this.extractEmails(c?.message?.text || "");
        extractedEmails.push(...emailList);
      }
      console.log(`📧 Emails found: ${extractedEmails.length}`);

      // Get reactions
      const likes = await this.getPostReactions(postUrn);
      console.log(`👍 Likes: ${likes}`);

      return {
        tag: postUrn,
        likes,
        comments: commentCount,
        emails: extractedEmails,
        impressions: 0, // Not accessible with current permissions
        shares: 0, // Not accessible with current permissions
      };
    } catch (error: any) {
      console.log(`❌ Error getting analytics for ${postUrn}:`, error?.message);
      return {
        tag: postUrn,
        likes: 0,
        comments: 0,
        emails: [],
        impressions: 0,
        shares: 0,
      };
    }
  }

  async getActivityPostAnalytics(activityUrn: string): Promise<any> {
    const encoded = this.encodeUrn(activityUrn);
    const extractedEmails: string[] = [];
    let likes = 0;
    let comments = 0;
    try {
      const likesUrl = `https://api.linkedin.com/v2/socialActions/${encoded}/likes`;
      const likesResponse = await axios.get(likesUrl, {
        headers: this.headers,
        params: { start: 0, count: 100 },
      });

      likes = likesResponse.data?.paging?.total || 0;
      console.log(`✅ Likes: ${likes}`);

      if (likesResponse.data?.elements?.length > 0) {
        console.log(
          `👤 Recent likes from: ${likesResponse.data.elements.length} users`
        );
      }

      const commentsUrl = `https://api.linkedin.com/v2/socialActions/${encoded}/comments`;
      const commentsResponse = await axios.get(commentsUrl, {
        headers: this.headers,
        params: { start: 0, count: 100 },
      });

      // console.log("✅ Fetched reactions data:", encodedResponse.data);
      // return likesResponse.data;
    } catch (error) {
      console.error("Failed to fetch activity post analytics:", error);
    }

    // Get comments using v2 socialActions API
    try {
      const commentsUrl = `https://api.linkedin.com/v2/socialActions/${encoded}/comments`;
      const commentsResponse = await axios.get(commentsUrl, {
        headers: this.headers,
        params: { start: 0, count: 100 },
      });

      // Parse comments from the response
      const commentElements = commentsResponse.data?.elements || [];
      comments = commentElements.length;
      console.log(`✅ Comments: ${comments}`);

      // Extract emails from comments
      for (const comment of commentElements) {
        const commentText = comment.message?.text || "";
        const emails = this.extractEmails(commentText);
        extractedEmails.push(...emails);

        // Log comment details (optional)
        if (commentText) {
          console.log(
            `💬 Comment: "${commentText.substring(0, 100)}${
              commentText.length > 100 ? "..." : ""
            }"`
          );
        }
      }

      console.log(`📧 Emails found: ${extractedEmails.length}`);
    } catch (commentsError: any) {
      console.log(
        `❌ Failed to get comments: ${commentsError.response?.status} - ${commentsError.message}`
      );
    }

    const result = {
      tag: activityUrn,
      likes,
      comments,
      emails: [...new Set(extractedEmails)], // Remove duplicates,
    };

    console.log(
      `📊 Final analytics for ${activityUrn}:`,
      JSON.stringify(result, null, 2)
    );
    return result;
  }

  // Add method to reply to post (top-level comment)
  async replyToComment(
    commentUrn: string,
    replyText: string,
    actorUrn?: string
  ): Promise<{ success: boolean; replyUrn?: string; error?: string }> {
    try {
      console.log(`💬 Attempting to reply to comment: ${commentUrn}`);
      console.log(`📝 Reply text: "${replyText}"`);

      // Get your person URN if not provided
      let personUrn = actorUrn;
      if (!personUrn) {
        try {
          const profileResponse = await axios.get(
            "https://api.linkedin.com/v2/me",
            {
              headers: this.headers,
            }
          );
          personUrn = `urn:li:person:${profileResponse.data.id}`;
          console.log(`👤 Using actor URN: ${personUrn}`);
        } catch (error) {
          throw new Error("Failed to get your LinkedIn profile ID");
        }
      }

      // Method 1: Try SocialActions Posts API (most likely to work)
      try {
        console.log("🔄 Trying SocialActions Posts API for comment reply...");

        const commentId = "7397625105830506496";
        const targetUrn = `urn:li:comment:${commentId}`;
        const encodedUrn = encodeURIComponent(targetUrn);
        // const commentUrn = `urn:li:comment:${commentId}`;
        // const encoded = encodeURIComponent(commentUrn);

        const commentUrl = `https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`;
        const payload = {
          actor: "urn:li:person:Jw8kVRKDgR",
          message: { text: replyText },
        };

        console.log(
          `📨 Posting reply via SocialActions API with url: ${commentUrl}`
        );

        const response = await axios.post(commentUrl, payload, {
          headers: {
            ...this.headers,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 201 || response.status === 200) {
          const replyUrn = response.headers["x-restli-id"] || response.data?.id;
          console.log(
            `✅ Reply posted via SocialActions API! URN: ${replyUrn}`
          );
          return { success: true, replyUrn };
        }
      } catch (ugcError: any) {
        console.log(
          `⚠️ SocialActions API failed: ${ugcError.response?.status} - ${
            ugcError.response?.data?.message || ugcError.message
          }`
        );

        console.error("SocialActions API error details:", ugcError);
      }

      return {
        success: false,
        error:
          "LinkedIn comment replies require special permissions not available in your current app setup. Consider using LinkedIn's native interface for replies.",
      };
    } catch (error: any) {
      console.error("❌ Error replying to comment:", error.message);
      return { success: false, error: error.message };
    }
  }

  // reply nested comments
  async replyToLinkedInComment(params: ReplyToCommentRequest) {
    const { postActivityUrn, actorPersonUrn, replyText, parentCommentUrn } =
      params;

    const tempEncodedParentCommentUrn = encodeURIComponent(parentCommentUrn);
    const encodedParentCommentUrn = tempEncodedParentCommentUrn
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    console.log("Encoded Parent Comment URN:", encodedParentCommentUrn);
    // const url = `https://api.linkedin.com/rest/socialActions/${encodedParentCommentUrn}/comments`;
    const url = `https://api.linkedin.com/rest/socialActions/${encodedParentCommentUrn}/comments`;

    console.log("Reply URL:", url);

    const body = {
      actor: actorPersonUrn,
      object: postActivityUrn,
      parentComment: parentCommentUrn,
      message: { text: replyText },
    };

    try {
      console.log("Posting reply to LinkedIn comment...", { url, body });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202511",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`LinkedIn API error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      return data; // Contains commentUrn, id, message, etc.
    } catch (error) {
      console.error("Error replying to LinkedIn comment:", error);
    }
  }

  async getPersonUrn(): Promise<string | null> {
    try {
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/me",
        {
          headers: this.headers,
        }
      );
      let personUrn = `urn:li:person:${profileResponse.data.id}`;
      console.log(`👤 Using actor URN: ${personUrn}`);
      return personUrn;
    } catch (error) {
      throw new Error("Failed to get your LinkedIn profile ID");
    }
  }
}
