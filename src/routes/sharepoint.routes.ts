import express, { Request, Response } from "express";
import {
  getItemsByListName,
  savePostAndPromptToList,
  savePostToList,
  savePromptToList,
  syncPostList,
} from "../controllers/sharepoint.controller";
import { validateItem } from "../middlewares/validateItem";

const router = express.Router();

router.get("/items/:listName", getItemsByListName);

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "SharePoint routes are healthy!" });
});

router.get("/sync/post", syncPostList);

// Create single items in SharePoint List (Prompt)
router.post("/save/prompt", savePromptToList);

// Create single items in SharePoint List (Post)
router.post("/save/post", savePostToList);

// Create items in SharePoint List (both Prompt and Post)
router.post("/save", validateItem, savePostAndPromptToList);

export default router;
