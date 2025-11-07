import { get } from "axios";
import express, { Request, Response } from "express";
import { getDashboardData } from "../controllers/dashboard.controller";
const router = express.Router();

router.get("/metrics", getDashboardData);

export default router;
