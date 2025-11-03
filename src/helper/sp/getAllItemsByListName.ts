export const getAllItemsByListName = async (token: string) => {
  const siteHostname = "itcart.sharepoint.com";
  const sitePath = "/sites/AIXHub";
  const listName = "Prompt";

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteHostname}:${sitePath}:/lists/${listName}/items?expand=fields`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if(response.status !== 200){
        throw Error()
    }

    const data = await response.json();
    return data?.value;
    // console.log("✅ Graph list items:", data?.value);
  } catch (error) {
    console.error("❌ Error fetching all lists", error);
    return null;
  }
};
