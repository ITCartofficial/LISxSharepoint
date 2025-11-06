import { ErrorRequestHandler, Request, Response } from "express";
import { getAllItemsByListName } from "../services/sharepoint.service";

export const getItemsByListName = async (req: Request, res: Response) => {
  const { listName } = req.params;

  try {
    const items = await getAllItemsByListName(listName);
    return res.status(200).json({
      status: 200,
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching items:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
};
