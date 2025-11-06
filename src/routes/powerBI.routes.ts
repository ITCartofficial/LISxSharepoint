import express from "express";
import axios from "axios";
import { getAccessToken } from "../helper/powerBI/getAccessToken";

const router = express.Router();

router.post("/embed-token", async (req, res) => {
  try {
    const { groupId, reportId } = req.body;

    if (!groupId || !reportId) {
      res.status(400).json({
        error: "Missing required fields in the request body",
      });
    }

    const accessToken = await getAccessToken();

    const apiUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`;

    const body = {
      accessLevel: "View",
      lifetimeInMinutes: 10, // 10 mins
    };

    const response = await axios.post(apiUrl, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    res.json({
      embedToken: response.data.token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error(
      "Error generating embed token:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate embed token" });
  }
});

export default router;
