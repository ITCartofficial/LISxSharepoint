// import express, { Request, Response } from "express";
// import multer from "multer";
// import { getSPSiteId, getSPToken } from "../config/tokenStore";

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// router.post(
//   "/upload",
//   upload.single("file"),
//   async (req: Request, res: Response) => {
//     try {
//       const accessToken = getSPToken();
//       const siteId = getSPSiteId();
//       const driveName = "LISBlob";
//       const file = req.file;

//       if (!file) {
//         return res.status(400).json({ message: "File not provided" });
//       }

//       // Get driveId by name
//       const driveRes = await fetch(
//         `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
//         {
//           headers: { Authorization: `Bearer ${accessToken}` },
//         }
//       );
//       const driveData = await driveRes.json();
//       const driveId = driveData.value.find(
//         (d: any) => d.name === driveName
//       )?.id;

//       if (!driveId) {
//         return res.status(404).json({ message: "Drive not found" });
//       }

//       // Upload file
//       const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${file.originalname}:/content`;

//       // Convert multer Buffer to a Blob so TypeScript/fetch accepts it as BodyInit
//       const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });

//       const uploadRes = await fetch(uploadUrl, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": file.mimetype,
//           "Content-Length": String(file.size),
//         },
//         body: fileBlob,
//       });

//       const uploadedFile = await uploadRes.json();

//       if (!uploadRes.ok) {
//         return res.status(uploadRes.status).json({ error: uploadedFile });
//       }

//       // You can save uploadedFile.webUrl to SharePoint List item
//       return res.status(201).json({
//         message: "File uploaded successfully",
//         fileUrl: uploadedFile.webUrl,
//       });
//     } catch (error) {
//       console.error("Error uploading file:", error);
//       return res.status(500).json({ message: "Error uploading file." });
//     }
//   }
// );

// export default router;
