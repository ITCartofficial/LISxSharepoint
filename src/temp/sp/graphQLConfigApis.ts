import axios from "axios";

export const getSiteId = async (accessToken: string) => {
  const siteUrl =
    "https://graph.microsoft.com/v1.0/sites/itcart.sharepoint.com:/sites/AIXHub";

  const response = await axios.get(siteUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // console.log("✅ Site Info:", response.data);
  return response.data.id; // <-- this is your siteId
};

export const getListIdByName = async (
  accessToken: string,
  siteId: string,
  listName: string
) => {
  try {
    const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // console.log("✅ List Found:", response.data);
    return response.data.id; // <-- this is your listId
  } catch (error) {
    console.error("❌ Error fetching list by name:", error);
    return null;
  }
};

