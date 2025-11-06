import axios from "axios";
import { config } from "../config";

export const getAnalyticsData = async (tags: string[]) => {
  try {
    const response = await axios.post(`${config.agentUrl}/analytics`, {
      post_urn: tags,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch analytics data");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};
