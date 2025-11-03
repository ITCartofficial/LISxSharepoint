import express from "express";
import { getListIdByName } from "../helper/sp/graphQLConfigApis";
import { getSPListId, getSPSiteId, getSPToken } from "../config/tokenStore";
import {
  createBulkListItems,
  createListItem,
} from "../helper/sp/createListItem";

const router = express.Router();

// /prompt - Create single items in SharePoint List (Prompt)
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

  if (!tag || !prompt || !scheduledAt || !promptCreatedAt) {
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

// POST /prompt/bulk — Create multiple items in SharePoint list (Prompt)
router.post("/prompt/bulk", async (req, res) => {
  try {
    const token = getSPToken();
    const siteId = getSPSiteId();
    const listId = getSPListId();

    // 🧩 Check environment setup
    if (!token || !siteId || !listId) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "Token or site configuration not initialized on server",
      });
    }

    // 🧾 Validate request body
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Request body must contain an array of items",
      });
    }

    // 🧱 Prepare each item with required fields
    const formattedItems = items.map((item, index) => {
      const { tag, prompt, isPosted, approved, scheduledAt, promptCreatedAt } =
        item;
      if (!tag || !prompt || !scheduledAt || !promptCreatedAt) {
        throw new Error(`Item at index ${index} missing required fields`);
      }
      return {
        Title: tag,
        prompt,
        isPosted,
        approved,
        scheduledAt,
        promptCreatedAt,
      };
    });

    // 🚀 Call bulk creation helper
    const result = await createBulkListItems(
      siteId,
      listId,
      token,
      formattedItems
    );

    // ✅ Response
    return res.status(201).json({
      status: 201,
      success: true,
      message: "Bulk items processed successfully",
      results: result,
    });
  } catch (error) {
    console.error("❌ Bulk creation error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Bulk item creation failed",
      error: error,
    });
  }
});

export default router;
