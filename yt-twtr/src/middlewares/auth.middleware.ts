import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import JWT from "jsonwebtoken";
import User from "../models/user.model";
import { TokenPayload } from "../types";

export const verifyJWT = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      throw new ApiErrors(401, "Unauthorized access");
    }
    const decodedToken = JWT.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET ?? "secteytdsrgfg"
    ) as TokenPayload;
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiErrors(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiErrors(401, error?.message || "Unauthorized access");
  }
});
