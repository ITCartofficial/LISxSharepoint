import express from "express";
import { config } from "./src/config";
import powerbiRoutes from "./src/routes/powerBI.routes";
import sharePointRoutes from "./src/routes/sharepoint.routes";
import dashboardRoutes from "./src/routes/dashboard.routes";
import cors from "cors";
import { setLeadListId, setPostListId, setPromptListId } from "./src/constants/store";
import { getADAccessToken } from "./src/services/auth.service";
import { getListIdByName, getSiteIdByName } from "./src/services/sharepoint.service";

const app = express();
app.use(cors());
app.use(express.json());

getADAccessToken()
  .then(async (token) => {
    console.log("✅ Azure AD Access Token retrieved");
    console.log("Server is starting....");

    const promptListId = await getListIdByName("Prompt");
    setPromptListId(promptListId);

    const postListId = await getListIdByName("Post");
    setPostListId(postListId);

    const leadListId = await getListIdByName("Leads");
    setLeadListId(leadListId);

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to retrieve Azure AD Access Token:", error);
    process.exit(1);
  });

app.use("/api/powerbi", powerbiRoutes);
app.use("/api/sp", sharePointRoutes);
app.use("/api/dashboard", dashboardRoutes);
