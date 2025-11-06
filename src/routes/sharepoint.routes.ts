import { get } from "axios";
import express, { Request, Response } from "express";
import { getItemsByListName } from "../controllers/sharepoint.controller";

const router = express.Router();

router.get("/items/:listName", getItemsByListName);

export default router;