import dotenv from "dotenv";
dotenv.config();

export const config = {
  tenantId: process.env.TENANT_ID!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  port: process.env.PORT || 5000,
  sharepointDomain: process.env.SHAREPOINT_DOMAIN || "itcart.sharepoint.com",
  sharepointSite: process.env.SHAREPOINT_SITE || "AIXHub",
  agentUrl: process.env.AGENT_URL || "http://127.0.0.1:8000",
  siteId: process.env.SITE_ID || "",
};