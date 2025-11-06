import { NextFunction, Request, Response } from "express";

export const validateItem = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tag, prompt, post } = req.body;

    if (!tag) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Missing required field: tag",
      });
    }

    // 🧩 Validate prompt
    const promptRequired = [
      "prompt",
      "isApproved",
      "scheduledAt",
      "promptCreatedAt",
    ];

    const missingPromptFields = promptRequired.filter(
      (key) => !prompt || prompt[key] === undefined || prompt[key] === null
    );

    if (missingPromptFields.length > 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: `Missing required prompt fields: ${missingPromptFields.join(
          ", "
        )}`,
      });
    }
    // 🧩 Validate post
    const postRequired = [
      "platform",
      "postedAt",
      "content",
      "isApproved",
      "postUrl",
    ];
    const missingPostFields = postRequired.filter(
      (key) => !post || post[key] === undefined || post[key] === null
    );

    if (missingPostFields.length > 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: `Missing required post fields: ${missingPostFields.join(
          ", "
        )}`,
      });
    }

    next();
  } catch (error: any) {
    console.error("Error validating data:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Failed to validate data",
      error: error.message,
    });
  }
};
