import axios from "axios";
import { getADToken } from "../constants/store";
import { config } from "../config/index";
import { getADAccessToken } from "./auth.service";
import { PostItem, SharePointListItem } from "../types/sharepoint.type";

export const getSiteIdByName = async (accessToken: string) => {
  try {
    const siteUrl = `https://graph.microsoft.com/v1.0/sites/${config.sharepointDomain}:/sites/${config.sharepointSite}`;

    const response = await axios.get(siteUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw Error();
    }

    return response.data.id;
  } catch (error) {
    console.error("❌ Error fetching site ID:", error);
    throw error;
  }
};

export const getListIdByName = async (listName: string) => {
  try {
    let token = getADToken();
    if (token?.expires_in && token.access_token) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.expires_in < currentTime) {
        token = await getADAccessToken();
      }
    }
    const url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listName}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token?.access_token}`,
      },
    });

    if (response.status !== 200) {
      throw Error();
    }

    // console.log("✅ List Found:", response.data);
    return response.data.id; // <-- this is your listId
  } catch (error) {
    console.error("❌ Error fetching list by name:", error);
    return null;
  }
};

export const getAllItemsByListName = async (listName: string) => {
  let token = getADToken();
  if (token?.expires_in && token.access_token) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (token.expires_in < currentTime) {
      token = await getADAccessToken();
    }
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${config.sharepointDomain}:/sites/${config.sharepointSite}:/lists/${listName}/items?expand=fields`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token?.access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw Error();
    }

    const data = await response.json();
    return data?.value;
    // console.log("✅ Graph list items:", data?.value);
  } catch (error) {
    console.error("❌ Error fetching all lists", error);
    return null;
  }
};

export const createListItem = async (
  listId: string,
  item: SharePointListItem
) => {
  try {
    let token = getADToken();
    if (token?.expires_in && token.access_token) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.expires_in < currentTime) {
        token = await getADAccessToken();
      }
    }

    const url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items`;

    const body = {
      fields: item,
    };

    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 201) {
      throw Error();
    }

    return response.data;
  } catch (error) {
    console.error("❌ Error creating list item:", error);
    throw error;
  }
};

export const findItemByFieldName = async (
  listId: string,
  fieldValue: string,
  fieldName: string = "postUrl"
) => {
  try {
    let token = getADToken();
    if (token?.expires_in && token.access_token) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.expires_in < currentTime) {
        token = await getADAccessToken();
      }
    }

    const url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items?$filter=fields/${fieldName} eq '${fieldValue}'`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token?.access_token}`,
      },
    });

    if (response.data.value.length === 0) {
      throw new Error(`No item found with postUrl = ${fieldValue}`);
    }

    // return the first matching item
    return response.data.value[0];
  } catch (error: any) {
    console.error("Error finding item by field name:", error.message);
    throw error;
  }
};

export const updatePostByTag = async (
  listId: string,
  tag: string,
  updateFields: object
) => {
  try {
    let token = getADToken();
    if (token?.expires_in && token.access_token) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.expires_in < currentTime) {
        token = await getADAccessToken();
      }
    }

    // Step 1: Find item by tag
    const item = await findItemByFieldName(listId, tag, "tag");

    if (!item) {
      return new Error(`Item with tag ${tag} not found`);
    }

    const itemId = item.id;

    // Step 2: Update it
    const url = `https://graph.microsoft.com/v1.0/sites/${config.siteId}/lists/${listId}/items/${itemId}/fields`;

    const response = await axios.patch(url, updateFields, {
      headers: {
        Authorization: `Bearer ${token?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response) {
      return new Error(`Failed to update item with tag ${tag}`);
    }

    return response.data;
  } catch (error: any) {
    console.error("Failed to update by tag:", error.message);
    throw error;
  }
};

export const getPostEngagementMetrics = async () => {
  try {
    const emailList = await getAllItemsByListName("Leads");
    const posts = await getAllItemsByListName("Post");
    if (!posts) {
      console.log("No posts found in SharePoint.");
      return {
        total_likes: 0,
        total_engagements: 0,
        total_impressions: 0,
        email_contacted: emailList ? emailList.length : 0,
        all_posts: [],
      };
    }

    const items = posts.map((item: any) => ({
      tag: item.fields.tag,
      platform: item.fields.platform,
      likes: item.fields.likes,
      comments: item.fields.comments,
      shares: item.fields.shares,
      impressions: item.fields.impressions,
      postUrl: item.fields.postUrl,
      postedAt: item.fields.postedAt,
      content: item.fields.content,
      visual: item.fields.visual,
      isApproved: item.fields.isApproved,
    }));

    const total_likes = items.reduce(
      (acc: number, curr: PostItem) => acc + (curr.likes || 0),
      0
    );
    const total_comments = items.reduce(
      (acc: number, curr: any) => acc + (curr.comments || 0),
      0
    );
    const total_shares = items.reduce(
      (acc: number, curr: any) => acc + (curr.shares || 0),
      0
    );

    const total_engagements = total_likes + total_comments + total_shares;

    const total_impressions = items.reduce(
      (acc: number, curr: any) => acc + (curr.impressions || 0),
      0
    );

    const engagement_rate = total_impressions > 0
      ? (total_engagements / total_impressions) * 100
      : 0;

    return {
      total_likes,
      total_engagements,
      total_impressions,
      email_contacted: emailList ? emailList.length : 0,
      all_posts: items,
    };
  } catch (error) {
    console.error("Error fetching posts from SharePoint:", error);
  }
};
