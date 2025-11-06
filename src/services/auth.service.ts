import { config as ADConfig } from "../config/index";
import axios from "axios";
import { setADToken } from "../constants/store";

export const getADAccessToken = async () => {
  try {
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

    if (response.status !== 200) {
      throw new Error("Failed to retrieve access token");
    }

    setADToken({
      access_token: response.data.access_token,
      expires_in: Date.now() + response.data.expires_in * 1000,
    });
    return response.data;
  } catch (error) {
    console.error("Error retrieving Azure AD access token:", error);
    throw error;
  }
};
