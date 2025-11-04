import axios from "axios";
import fs from "fs";

export async function getDriveIdByName(
  accessToken: string,
  siteId: string,
  driveName: string
) {
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const drives = response.data.value;
  if (!drives || drives.length === 0) {
    throw new Error("No drives found for this site");
  }

  const drive = drives.find(
    (d: any) => d.name.toLowerCase() === driveName.toLowerCase()
  );
  // const drive = response.data.value[0]
  console.log(`✅ Drive Data: ${drive}`);
  console.log(`✅ Drive found: ${drive.name}`);
  console.log(`🆔 Drive ID: ${drive.id}`);

  return drive.id;
}

export async function getDriveFiles(accessToken: string, driveId: string) {
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  console.log(res.data.value);
  return res.data.value;
}

export const uploadImage = async (
  accessToken: string,
  driveId: string,
  filePath: string,
  folderPath: string = "SharedImages"
) => {
  const fileName = filePath.split("/").pop();
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${fileName}:/content`;

  const imageBuffer = fs.readFileSync(filePath); // Or use Blob if from frontend

  const res = await axios.put(url, imageBuffer, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/png", // Change if jpg/jpeg
    },
  });

  return {
    id: res.data.id,
    name: res.data.name,
    webUrl: res.data.webUrl,
  };
};
