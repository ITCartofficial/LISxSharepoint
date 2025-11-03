import axios from "axios";

export const createListItem = async (
  siteId: string,
  listId: string,
  token: string,
  item: Object
) => {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`;

  const body = {
    fields: item,
  };

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};