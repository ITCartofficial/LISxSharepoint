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
} from "./src/core/tokenStore";
import { getAllItemsByListName } from "./src/helper/sp/getAllItemsByListName";

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

    // const allList: any[] | null = await getAllItemsByListName(token);
    // allList && console.log("List", allList.length);
    const siteId = await getSiteId(token.access_token);
    siteId && setSPSiteId(siteId);
    // console.log("Site Id:", siteId);
    const promptListId = await getListIdByName(token.access_token, siteId, "Prompt");
    promptListId && setPromptListId(promptListId);

    const postListId = await getListIdByName(token.access_token, siteId, "Post");
    postListId && setPostListId(postListId);

    // const items = await getAllItemsByListName(token, "Post");

    // if (!items) {
    //   console.log("No items found");
    //   return;
    // }

    // const tags = items.map((item: any) => item.fields.tag);

    // console.log("Items", { length: items.length, tags: tags });

    // await getDrives(token, siteId);
    // const driveId = await getDriveIdByName(token, siteId, "LISBlob");
    // await getDriveFiles(token, driveId);
    // console.log("List Id: ", listId);

    // Create Graph batch payload

    // Create items
    // const item = {
    //   Title: "AI Automation",
    //   prompt:
    //     "Generate a LinkedIn post about how AI transforms workflow automation.",
    //   approved: true,
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
    // const res = await createListItem(siteId, listId, token, postItem);
    // res && console.log("Data after creating item:", res);
  } catch (err) {
    console.error("❌ Error fetching", err);
  }
})();
