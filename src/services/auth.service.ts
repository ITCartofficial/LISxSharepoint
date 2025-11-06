import { config as ADConfig } from "../config/index";
import axios from "axios";

export const getSharePointAccessToken = async () => {
  const tenantId = ADConfig.tenantId;
  const clientId = ADConfig.clientId;
  const clientSecret = ADConfig.clientSecret;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");
  
  const response = await axios.post(tokenUrl, params);
  return response.data; // access_token, expires_in etc.
};

