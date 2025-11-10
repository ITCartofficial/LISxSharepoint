import { NextFunction, Request, Response } from "express";
import { getAllItemsByListName } from "../services/sharepoint.service";

export const validateLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, tag } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required field: email",
      });
    }

    if (!tag) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required field: tag",
      });
    }

    const emailList = await getAllItemsByListName("Leads");

    if (!emailList) {
      next();
      return;
    }

    const emailExists = emailList?.some(
      (item: any) => item.fields.email === email
    );

    console.log("Email Exists:", emailExists);

    if (emailExists) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Email already exists",
      });
    }

    next();
  } catch (error: any) {
    console.error("Error validating lead data:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to validate lead data",
      error: error.message,
    });
  }
};
