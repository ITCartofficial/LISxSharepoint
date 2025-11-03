import express from "express";
import { getListIdByName } from "../helper/sp/graphQLConfigApis";
import { getSPListId, getSPSiteId, getSPToken } from "../config/tokenStore";
import { createListItem } from "../helper/sp/createListItem";

const router = express.Router();

router.post("/prompt", async (req, res) => {
  const token = getSPToken();
  const siteId = getSPSiteId();
  const listId = getSPListId();

  if (!token || !siteId || !listId) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Token not initialized on server",
    });
  }

  const { tag, prompt, isPosted, approved, scheduledAt, promptCreatedAt } =
    req.body;

  if (
    !tag ||
    !prompt ||
    !scheduledAt ||
    !promptCreatedAt
  ) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Missing required fields",
    });
  }

  const item = {
    Title: tag,
    prompt,
    isPosted,
    approved,
    scheduledAt,
    promptCreatedAt,
  };

  const data = await createListItem(siteId, listId, token, item);
  if (!data) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to create user due to a server error",
    });
  }

  return res.status(201).json({
    status: 201,
    success: true,
    message: "Prompt created successfully",
    data: data,
  });
});



export default router;
