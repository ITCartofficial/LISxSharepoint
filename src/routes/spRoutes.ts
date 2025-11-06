import express, { Request, Response } from "express";
import { getListIdByName } from "../helper/sp/graphQLConfigApis";
import {
  getPostListId,
  getPromptListId,
  getSPSiteId,
  getSPToken,
} from "../core/tokenStore";
import {
  createBulkListItems,
  createListItem,
} from "../helper/sp/createListItem";
import {
  findListItemByField,
  updatePostByPostUrl,
  updatePostByTag,
} from "../helper/sp/updateListItem";

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
      const {
        tag,
        prompt,
        isPosted,
        isApproved,
        scheduledAt,
        promptCreatedAt,
      } = item;
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

// post - Create single items in SharePoint List (Post)
router.post("/post", async (req, res) => {
  const token = getSPToken();
  const siteId = getSPSiteId();
  const listId = getPostListId();

  if (!token || !siteId || !listId) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Token not initialized on server",
    });
  }

  const { tag, platform, postedAt, content, visual, postUrl, isApproved } =
    req.body;

  if (
    !tag ||
    !platform ||
    !postedAt ||
    !content ||
    !visual ||
    !postUrl ||
    isApproved === undefined
  ) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Missing required fields",
    });
  }

  const item = {
    tag,
    platform,
    postedAt,
    content,
    visual,
    postUrl,
    isApproved,
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

router.put("/update-post", async (req: Request, res: Response) => {
  const { tag, data } = req.body;

  if (!tag || !data) {
    return res.status(400).json({ message: "tag and data are required." });
  }

  try {
    // Replace with your values
    const token = getSPToken();
    const siteId = getSPSiteId();
    const listId = getPostListId();

    if (!token || !siteId || !listId) {
      return res.status(500).json({
        message: "SharePoint configuration not initialized on the server.",
      });
    }

    // 2️⃣ Update the found item
    const updatedItem = await updatePostByTag(
      siteId,
      listId,
      token,
      tag,
      data
    );

    if (!updatedItem) {
      return res
        .status(500)
        .json({ message: "Failed to update the post item." });
    }

    const newItem = {
      id: updatedItem.id,
      postUrl: updatedItem.postUrl,
      tag: updatedItem.tag,
      platform: updatedItem.platform,
      postedAt: updatedItem.postedAt,
      content: updatedItem.content,
      visual: updatedItem.visual,
      isApproved: updatedItem.isApproved,
      likes: updatedItem.likes,
      comments: updatedItem.comments,
      impressions: updatedItem.impressions,
    };

    return res.status(200).json({
      message: "Post updated successfully.",
      updatedItem: newItem,
    });
  } catch (error: any) {
    console.error(
      "Error updating post:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to update post.",
      error: error.response?.data || error.message,
    });
  }
});

router.post("/update-post/bulk", async (req, res) => {
  const posts = req.body;

  if (!posts || !Array.isArray(posts)) {
    return res.status(400).json({ message: "Invalid data format." });
  }

  try {
    // Replace with your values
    const token = getSPToken();
    const siteId = getSPSiteId();
    const listId = getPostListId();

    if (!token || !siteId || !listId) {
      return res.status(500).json({
        message: "SharePoint configuration not initialized on the server.",
      });
    }

    // 2️⃣ Update the found items
    const results = await Promise.allSettled(
      posts.map((item) =>
        updatePostByTag(siteId, listId, token, item.tag, item.data)
      )
    );

    const successfulUpdates = results
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    const failedUpdates = results
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      )
      .map((result, index) => ({
        tag: posts[index].tag,
        error: result.reason?.message || "Update failed",
      }));

    return res.status(200).json({
      message: "Posts update process completed",
      successCount: successfulUpdates.length,
      failureCount: failedUpdates.length,
      // updatedItems: successfulUpdates,
      // failedItems: failedUpdates,
    });
  } catch (error: any) {
    console.error(
      "Error updating posts:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to update posts.",
      error: error.response?.data || error.message,
    });
  }
});

export default router;
