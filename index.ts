import express from "express";
import { config } from "./src/config";
import powerbiRoutes from "./src/routes/powerbiRoutes";
import spRoutes from "./src/routes/spRoutes";
import cors from "cors";
import { getSharePointAccessToken } from "./src/helper/sp/getSharePointAccessToken";
import { getAllItemsByListName } from "./src/helper/sp/getAllItemsByListName";
import { getListIdByName, getSiteId } from "./src/helper/sp/graphQLConfigApis";
import { createListItem } from "./src/helper/sp/createListItem";
import { setSPListId, setSPSiteId, setSPToken } from "./src/config/tokenStore";

// const requestURL = "{0}/_api/Web/Lists/GetByTitle('{1}')/Items{2}";

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
    token && setSPToken(token);
    // const allList: any[] | null = await getAllItemsByListName(token);
    // allList && console.log("List", allList.length);
    const siteId = await getSiteId(token);
    siteId && setSPSiteId(siteId);
    // console.log("Site Id:", siteId);
    const listId = await getListIdByName(token, siteId, "Prompt");
    listId && setSPListId(listId);
    // console.log("List Id: ", listId);
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
    // const res = await createListItem(siteId, listId, token, item);
    // res && console.log("Data after creating item:", res)
  } catch (err) {
    console.error("❌ Error fetching", err);
  }
})();
