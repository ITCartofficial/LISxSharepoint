import express from "express";
import { getListIdByName } from "../helper/sp/graphQLConfigApis";
import {
  getPostListId,
  getPromptListId,
  getSPSiteId,
  getSPToken,
} from "../config/tokenStore";
import {
  createBulkListItems,
  createListItem,
} from "../helper/sp/createListItem";

const router = express.Router();

// /prompt - Create single items in SharePoint List (Prompt)
router.post("/prompt", async (req, res) => {
  const token = getSPToken();
  const siteId = getSPSiteId();
  const listId = getPromptListId();

  if (!token || !siteId || !listId) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Token not initialized on server",
    });
  }

  const { tag, prompt, isPosted, isApproved, scheduledAt, promptCreatedAt } =
    req.body;

  if (!tag || !prompt || !scheduledAt || !promptCreatedAt) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Missing required fields",
    });
  }

  const item = {
    tag,
    prompt,
    isPosted,
    isApproved,
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
    const listId = getPromptListId();

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
      const { tag, prompt, isPosted, isApproved, scheduledAt, promptCreatedAt } =
        item;
      if (!tag || !prompt || !scheduledAt || !promptCreatedAt) {
        throw new Error(`Item at index ${index} missing required fields`);
      }
      return {
        tag,
        prompt,
        isPosted,
        isApproved,
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

// POST /create - create a prompt and a post item in SharePoint list
router.post("/create", async (req, res) => {
  try {
    const token = getSPToken();
    const siteId = getSPSiteId();
    const promptListId = getPromptListId();
    const postListId = getPostListId();

    if (!token || !siteId || !promptListId || !postListId) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "SharePoint configuration not initialized on the server.",
      });
    }

    const { tag, prompt, post } = req.body;

    // 🧩 Validate tag
    if (!tag || typeof tag !== "string" || tag.trim() === "") {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing or invalid 'tag' field.",
      });
    }

    // 🧩 Validate prompt
    const promptRequired = [
      "prompt",
      "isApproved",
      "isPosted",
      "scheduledAt",
      "promptCreatedAt",
    ];
    const missingPromptFields = promptRequired.filter(
      (key) => !prompt || prompt[key] === undefined || prompt[key] === null
    );

    if (missingPromptFields.length > 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: `Missing required prompt fields: ${missingPromptFields.join(
          ", "
        )}`,
      });
    }

    // 🧩 Validate post
    const postRequired = [
      "platform",
      "postedAt",
      "content",
      "isApproved",
      "postUrl",
    ];
    const missingPostFields = postRequired.filter(
      (key) => !post || post[key] === undefined || post[key] === null
    );

    if (missingPostFields.length > 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: `Missing required post fields: ${missingPostFields.join(
          ", "
        )}`,
      });
    }

    // 🧠 Prepare data
    const promptItem = {
      tag: tag,
      prompt: prompt.prompt,
      isApproved: prompt.isApproved,
      isPosted: prompt.isPosted,
      scheduledAt: prompt.scheduledAt,
      promptCreatedAt: prompt.promptCreatedAt,
    };

    const postItem = {
      tag: tag,
      platform: post.platform,
      postedAt: post.postedAt,
      content: post.content,
      visual: post.visual || null,
      isApproved: post.isApproved,
      postUrl: post.postUrl,
    };

    // 🪄 Create both in SharePoint lists
    const [promptRes, postRes] = await Promise.all([
      createListItem(siteId, promptListId, token, promptItem),
      createListItem(siteId, postListId, token, postItem),
    ]);

    if (!promptRes || !postRes) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "Failed to create one or both items in SharePoint.",
      });
    }

    const cleanedData = {
      tag,
      prompt: {
        id: promptRes.id,
        tag: promptRes.fields.tag,
        prompt: promptRes.fields.prompt,
        isApproved: promptRes.fields.isApproved,
        isPosted: promptRes.fields.isPosted,
        scheduledAt: promptRes.fields.scheduledAt,
        promptCreatedAt: promptRes.fields.promptCreatedAt,
        createdAt: promptRes.fields.Created,
        webUrl: promptRes.webUrl,
      },
      post: {
        id: postRes.id,
        tag: postRes.fields.tag,
        platform: postRes.fields.platform,
        content: postRes.fields.content,
        visual: postRes.fields.visual,
        postUrl: postRes.fields.postUrl,
        isApproved: postRes.fields.isApproved,
        postedAt: postRes.fields.postedAt,
        createdAt: postRes.fields.Created,
        webUrl: postRes.webUrl,
        likes: postRes.likes,
        comments: postRes.comments,
        impressions: postRes.impressions,
      },
    };

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Prompt and Post created successfully.",
      data: cleanedData,
    });
  } catch (error) {
    console.error("❌ Error creating prompt & post:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: error,
    });
  }
});

export default router;
