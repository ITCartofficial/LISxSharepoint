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

export const createBulkListItems = async (
  siteId: string,
  listId: string,
  token: string,
  items: any[]
) => {
  const batchUrl = "https://graph.microsoft.com/v1.0/$batch";

  const batchPayload = {
    requests: items.map((item, index) => ({
      id: String(index + 1),
      method: "POST",
      url: `/sites/${siteId}/lists/${listId}/items`,
      headers: { "Content-Type": "application/json" },
      body: { fields: item },
    })),
  };

  const res = await axios.post(batchUrl, batchPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
};