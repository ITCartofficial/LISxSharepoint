import axios from "axios";
import { config } from "../../config";

export const getAccessToken = async (): Promise<string> => {
  const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", config.clientId);
  params.append("client_secret", config.clientSecret);
  params.append("scope", "https://analysis.windows.net/powerbi/api/.default");

  const response = await axios.post(url, params);
  return response.data.access_token;
};
