import express from "express";
import { config } from "./src/config";
import powerbiRoutes from "./src/routes/powerbiRoutes";
import spRoutes from "./src/routes/spRoutes";
import cors from "cors";
import { getSharePointAccessToken } from "./src/helper/sp/getSharePointAccessToken";
import { getListIdByName, getSiteId } from "./src/helper/sp/graphQLConfigApis";
import {
  setPostListId,
  setPromptListId,
  setSPSiteId,
  setSPToken,
} from "./src/config/tokenStore";
import { getAllItemsByListName } from "./src/helper/sp/getAllItemsByListName";
import axios from "axios";
import {
  updateListItem,
  updatePostByTag,
} from "./src/helper/sp/updateListItem";
import { createListItem } from "./src/helper/sp/createListItem";

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api/powerbi", powerbiRoutes);
app.use("/api/sp", spRoutes);

app.listen(config.port, () => {
  console.log(`Power BI backend running on port ${config.port}`);
});

(async () => {
  try {
    const token = await getSharePointAccessToken();
    token && console.log("✅ SharePoint Authentication Successfully");
    token.access_token && setSPToken(token.access_token);

    // const allList: any[] | null = await getAllItemsByListName(token.access_token, "Post");
    // allList && console.log("List", allList.length);
    const siteId = await getSiteId(token.access_token);
    siteId && setSPSiteId(siteId);
    // console.log("Site Id:", siteId);
    const promptListId = await getListIdByName(
      token.access_token,
      siteId,
      "Prompt"
    );
    promptListId && setPromptListId(promptListId);

    const postListId = await getListIdByName(
      token.access_token,
      siteId,
      "Post"
    );
    postListId && setPostListId(postListId);

    // const items = await getAllItemsByListName(token.access_token, "Post");

    // if (!items) {
    //   console.log("No items found");
    //   return;
    // }

    // const postItems = items.map((item: any) => {
    //   return { tag: item.fields.tag, id: item.id };
    // });

    // const tags = postItems.map((t: any) => t.tag);

    // console.log("Items:", tags);

    // console.log("Fetching analytics data, Please wait....");

    // const result = await axios.post("http://127.0.0.1:8000/analytics", {
    //   post_urn: tags,
    // });

    // if (!result) {
    //   console.log("No analytics data found");
    //   return;
    // }

    // console.log("Analytics Data:", result.data);

    // const updatePromises = result.data.analytics.map(
    //   async (analyticsItem: any) => {
    //     try {
    //       const tag = analyticsItem.tag;
    //       const id = postItems.find((t: any) => t.tag === tag)?.id;

    //       if (!id) {
    //         throw new Error(`Item with tag ${tag} not found`);
    //       }

    //       const fieldsToUpdate = {
    //         likes: analyticsItem.likes,
    //         comments: analyticsItem.comments,
    //         impressions: analyticsItem.impressions,
    //         shares: analyticsItem.shares,
    //       };

    //       await updatePostByTag(
    //         siteId,
    //         postListId,
    //         token.access_token,
    //         tag,
    //         fieldsToUpdate
    //       );

    //       return {
    //         success: true,
    //         tag,
    //         message: "Updated successfully",
    //       };
    //     } catch (error: any) {
    //       return {
    //         success: false,
    //         tag: analyticsItem.tag,
    //         message: error.message || "Update failed",
    //       };
    //     }
    //   }
    // );

    // const results = await Promise.all(updatePromises);

    // const successful = results.filter((result) => result.success);
    // const failed = results.filter((result) => !result.success);

    // console.log(`✅ Successfully updated ${successful.length} items`);
    // console.log(`❌ Failed to update ${failed.length} items`);

    // if (failed.length > 0) {
    //   console.log("Failed updates:", failed);
    // }

    // await getDrives(token, siteId);
    // const driveId = await getDriveIdByName(token, siteId, "LISBlob");
    // await getDriveFiles(token, driveId);
    // console.log("List Id: ", listId);

    // Create Graph batch payload

    // Create items
    // const promptItem = {
    //   tag: "AI Automation 101",
    //   prompt:
    //     "Generate a LinkedIn post about how AI transforms workflow automation.",
    //   isApproved: true,
    //   isPosted: false,
    //   scheduledAt: "2025-11-01T09:30:00Z",
    //   promptCreatedAt: "2025-10-31T17:45:00Z",
    // };

    // const postItem = {
    //   tag: "AIXHub8777",
    //   platform: "LinkedIn",
    //   postedAt: "2025-11-01T09:30:00Z",
    //   content: "AI is revolutionizing how we learn, build, and grow. #AIXHub",
    //   visual: "https://itcart.ai/uploads/ai-banner.png",
    //   isApproved: true,
    //   postUrl: "https://linkedin.com/posts/itcart-ai",
    // };
    // const res = await createListItem(siteId, promptListId, token.access_token, promptItem);
    // res && console.log("Data after creating item:", res);
  } catch (err) {
    console.error("❌ Error fetching", err);
  }
})();
