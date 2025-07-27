import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import ApiResponse from "../utils/ApiResponse";
import Tweet from "../models/tweet.models";
import User from "../models/user.model";
// import Comment from "../models/comment.models";
import {
  CreateTweetRequest,
  UpdateTweetRequest,
  PaginationOptions,
  AuthenticatedRequest,
} from "../types";

// Create a new tweet
const createTweet = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as CreateTweetRequest;
  const userId = (req as AuthenticatedRequest).user._id;

  // Validate content
  if (!content?.trim()) {
    throw new ApiErrors(400, "Tweet content is required");
  }

  if (content.trim().length > 280) {
    throw new ApiErrors(400, "Tweet content cannot exceed 280 characters");
  }

  // Create tweet
  const tweet = await Tweet.create({
    content: content.trim(),
    user: userId,
    likes: [],
    comments: [],
  });

  // Fetch the created tweet with user details
  const createdTweet = await Tweet.findById(tweet._id)
    .populate("user", "username fullName avatar")
    .select("-__v");

  if (!createdTweet) {
    throw new ApiErrors(500, "Something went wrong while creating tweet");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

// Get all tweets with pagination
const getAllTweets = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    searchQuery,
  } = req.query as PaginationOptions & {
    searchQuery?: string;
  };

  // Build match conditions
  const matchConditions: any = {};

  // Add search functionality
  if (searchQuery) {
    matchConditions.content = { $regex: searchQuery, $options: "i" };
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get tweets with user data
  const tweets = await Tweet.find(matchConditions)
    .populate("user", "username fullName avatar")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalTweets = await Tweet.countDocuments(matchConditions);
  const totalPages = Math.ceil(totalTweets / limitNum);

  const paginationData = {
    docs: tweets,
    totalDocs: totalTweets,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res
    .status(200)
    .json(new ApiResponse(200, paginationData, "Tweets fetched successfully"));
});

// Get tweet by ID
const getTweetById = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  const tweet = await Tweet.findById(tweetId)
    .populate("user", "username fullName avatar")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        select: "username fullName avatar",
      },
    })
    .select("-__v");

  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched successfully"));
});

// Update tweet
const updateTweet = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const { content } = req.body as UpdateTweetRequest;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  if (!content?.trim()) {
    throw new ApiErrors(400, "Tweet content is required");
  }

  if (content.trim().length > 280) {
    throw new ApiErrors(400, "Tweet content cannot exceed 280 characters");
  }

  // Find tweet and verify ownership
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  if (tweet.user.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You can only update your own tweets");
  }

  // Update tweet
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content: content.trim() },
    { new: true }
  ).populate("user", "username fullName avatar");

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

// Delete tweet
const deleteTweet = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  // Find tweet and verify ownership
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  if (tweet.user.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You can only delete your own tweets");
  }

  // Delete tweet
  await Tweet.findByIdAndDelete(tweetId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

// Get user's tweets
const getUserTweets = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as PaginationOptions;

  if (!userId) {
    throw new ApiErrors(400, "User ID is required");
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiErrors(404, "User not found");
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get user's tweets
  const tweets = await Tweet.find({ user: userId })
    .populate("user", "username fullName avatar")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalTweets = await Tweet.countDocuments({ user: userId });
  const totalPages = Math.ceil(totalTweets / limitNum);

  const paginationData = {
    docs: tweets,
    totalDocs: totalTweets,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, paginationData, "User tweets fetched successfully")
    );
});

export {
  createTweet,
  getAllTweets,
  getTweetById,
  updateTweet,
  deleteTweet,
  getUserTweets,
};
