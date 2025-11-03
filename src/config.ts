import dotenv from "dotenv";
dotenv.config();

export const config = {
  tenantId: process.env.TENANT_ID!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  port: process.env.PORT || 5000,
  spBaseUrl: process.env.SPBASEURL!
};