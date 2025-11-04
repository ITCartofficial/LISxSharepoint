import axios from "axios";

export const findListItemByField = async (
  siteId: string,
  listId: string,
  accessToken: string,
  fieldValue: string
) => {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$filter=fields/postUrl eq '${fieldValue}'`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.data.value.length === 0) {
    throw new Error(`No item found with postUrl = ${fieldValue}`);
  }

  // return the first match (or all matches if you expect multiple)
  return response.data.value[0];
};

export const updateListItem = async (
  siteId: string,
  listId: string,
  itemId: string,
  accessToken: string,
  fieldsToUpdate: object
) => {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${itemId}/fields`;

  const response = await axios.patch(url, fieldsToUpdate, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

export const updatePostByPostUrl = async (
  siteId: string,
  listId: string,
  accessToken: string,
  postUrl: string,
  updateFields: object
) => {
  try {
    // Step 1: Find item by postUrl
    const item = await findListItemByField(
      siteId,
      listId,
      accessToken,
      postUrl
    );

    if (!item) {
      return new Error(`Item with postUrl ${postUrl} not found`);
    }

    const itemId = item.id;

    // Step 2: Update it
    const updated = await updateListItem(
      siteId,
      listId,
      itemId,
      accessToken,
      updateFields
    );

    if (!updated) {
      return new Error(`Failed to update item with postUrl ${postUrl}`);
    }

    return updated;
  } catch (error: any) {
    console.error("Failed to update by postUrl:", error.message);
    throw error;
  }
};
