import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import JWT from "jsonwebtoken";
import User from "../models/user.model";
import { TokenPayload, AuthenticatedRequest } from "../types";

// Type guard to check if request is authenticated
export const isAuthenticated = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined;
};

// Main JWT verification middleware
export const verifyJWT = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiErrors(401, "Unauthorized access - No token provided");
    }

    const decodedToken = JWT.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET ?? "secteytdsrgfg"
    ) as TokenPayload;

    if (!decodedToken?._id) {
      throw new ApiErrors(401, "Invalid token payload");
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    
    if (!user) {
      throw new ApiErrors(401, "Invalid access token - User not found");
    }

    // Explicitly assign user to make TypeScript happy
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error: any) {
    if (error instanceof ApiErrors) {
      throw error;
    }
    throw new ApiErrors(401, error?.message || "Unauthorized access");
  }
});

// Optional middleware - doesn't throw error if no user
export const optionalAuth = asyncHandler(async (req: Request, _: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next(); // Continue without user
    }

    const decodedToken = JWT.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET ?? "secteytdsrgfg"
    ) as TokenPayload;

    if (decodedToken?._id) {
      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
      );
      
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log("Optional auth failed:", error);
  }
  
  next();
});
