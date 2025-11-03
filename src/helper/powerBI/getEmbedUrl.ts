import axios from "axios";
import { config } from "../../config";

export const getEmbedUrl = async (
  reportId: string,
  groupId: string,
  authToken: string
): Promise<string> => {
  try {
    const url = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.log("Error on getEmbedUrl", error);
    return "";
  }
};
