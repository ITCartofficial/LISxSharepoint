import { Request, Response } from "express";
import {
  createListItem,
  getAllItemsByListName,
  updatePostByTag,
} from "../services/sharepoint.service";
import { PostItem, PromptItem } from "../types/sharepoint.type";
import {
  getPostListId,
  getPromptListId,
} from "../constants/store";
import { getAnalyticsData } from "../services/agent.service";

export const getItemsByListName = async (req: Request, res: Response) => {
  const { listName } = req.params;

  try {
    const items = await getAllItemsByListName(listName);
    return res.status(200).json({
      status: 200,
      success: true,
      data: items.map((item: any) => item.fields),
    });
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
};

export const savePromptToList = async (req: Request, res: Response) => {
  try {
    const body: PromptItem = req.body;
    const result = await createListItem(getPostListId() || "", body);

    return res.status(201).json({
      status: 201,
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error saving prompt:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to save prompt",
      error: error?.message,
    });
  }
};

export const savePostToList = async (req: Request, res: Response) => {
  try {
    const body: PostItem = req.body;
    const result = await createListItem(getPostListId() || "", body);
    return res.status(201).json({
      status: 201,
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error saving post:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to save post",
      error: error?.message,
    });
  }
};

export const savePostAndPromptToList = async (req: Request, res: Response) => {
  try {
    const { tag, prompt, post } = req.body;

    const [postResult, promptResult] = await Promise.all([
      createListItem(getPostListId() || "", {
        tag,
        ...post,
      }),
      createListItem(getPromptListId() || "", {
        tag,
        ...prompt,
      }),
    ]);

    if (!promptResult || !postResult) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "Failed to create items in SharePoint.",
      });
    }

    // const cleanedData = {
    //   tag,
    //   prompt: {
    //     id: promptResult.id,
    //     tag: promptResult.fields.tag,
    //     prompt: promptResult.fields.prompt,
    //     isApproved: promptResult.fields.isApproved,
    //     isPosted: promptResult.fields.isPosted,
    //     scheduledAt: promptResult.fields.scheduledAt,
    //     promptCreatedAt: promptResult.fields.promptCreatedAt,
    //   },
    //   post: {
    //     id: postResult.id,
    //     tag: postResult.fields.tag,
    //     platform: postResult.fields.platform,
    //     content: postResult.fields.content,
    //     visual: postResult.fields.visual,
    //     postUrl: postResult.fields.postUrl,
    //     isApproved: postResult.fields.isApproved,
    //     postedAt: postResult.fields.postedAt,
    //     createdAt: postResult.fields.Created,
    //     likes: postResult.fields.likes,
    //     comments: postResult.fields.comments,
    //     impressions: postResult.fields.impressions,
    //     shares: postResult.fields.shares,
    //   },
    // };

    return res.status(201).json({
      status: 201,
      success: true,
      message: "Prompt and Post saved successfully",
      tag: tag,
    });
  } catch (error: any) {
    console.error("Error saving prompt and post:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to save prompt and post",
      error: error.message,
    });
  }
};

export const syncPostList = async (req: Request, res: Response) => {
  try {
    const items = await getAllItemsByListName("Post");
    console.log("Fetched items:", items);

    if (!items) {
      return res.status(500).json({
        status: 500,
        success: false,
        message: "No items found to sync",
      });
    }

    // Here you can add logic to sync these items with your local database or another service
    const postItems = items.map((item: any) => {
      return { tag: item.fields.tag, id: item.id };
    });

    const tags: string[] = postItems.map((t: any) => t.tag);

    console.log("Fetching analytics data, Please wait....");
    const analyticsData = await getAnalyticsData(tags);
    console.log("Analytics data fetched:", analyticsData);

    // Merge analytics data with post items
    const promiseList = analyticsData.data.analytics.map(async (item: any) => {
      try {
        const tag = item.tag;
        const id = postItems.find((t: any) => t.tag === tag)?.id;

        if (!id) {
          throw new Error(`Item with tag ${tag} not found`);
        }

        const fieldsToUpdate = {
          likes: item.likes,
          comments: item.comments,
          impressions: item.impressions,
          shares: item.shares,
        };

        await updatePostByTag(getPostListId() || "", tag, fieldsToUpdate);

        return {
          success: true,
          tag,
          message: "Updated successfully",
        };
      } catch (error: any) {
        return {
          success: false,
          tag: item.tag,
          message: error.message || "Update failed",
        };
      }
    });

    const results = await Promise.all(promiseList);
    const successful = results.filter((result) => result.success);
    const failed = results.filter((result) => !result.success);

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Post list synced successfully",
      successCount: successful.length,
      failureCount: failed.length,
    });
  } catch (error: any) {
    console.error("Error syncing post list:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to sync post list",
      error: error.message,
    });
  }
};
