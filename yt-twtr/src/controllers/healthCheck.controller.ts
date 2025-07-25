import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiResponse from "../utils/ApiResponse";

const healthCheck = asyncHandler(async (_: Request, res: Response) => {
  res
    .status(200)
    .json(new ApiResponse(200, null, "Health check successfully passed"));
});

export default healthCheck;
