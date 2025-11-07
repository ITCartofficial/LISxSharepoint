import { Request, Response } from "express";
import { getPostEngagementMetrics } from "../services/sharepoint.service";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const response = await getPostEngagementMetrics();

    if (!response) {
      return res.status(404).json({ error: "No dashboard data found" });
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
