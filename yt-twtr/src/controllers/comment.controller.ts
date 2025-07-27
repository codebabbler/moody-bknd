import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import ApiResponse from "../utils/ApiResponse";
import Comment from "../models/comment.models";
import Video from "../models/video.model";
import Tweet from "../models/tweet.models";
import { AuthenticatedRequest, PaginationOptions } from "../types";

// Add comment to video
const addVideoComment = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  if (!content?.trim()) {
    throw new ApiErrors(400, "Comment content is required");
  }

  if (content.trim().length > 500) {
    throw new ApiErrors(400, "Comment content cannot exceed 500 characters");
  }

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  // Create comment
  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: userId,
  });

  // Populate and return comment with user data
  const createdComment = await Comment.findById(comment._id)
    .populate("owner", "username fullName avatar")
    .select("-__v");

  if (!createdComment) {
    throw new ApiErrors(500, "Something went wrong while creating comment");
  }

  res.status(201).json(
    new ApiResponse(201, createdComment, "Comment added successfully")
  );
});

// Add comment to tweet
const addTweetComment = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  if (!content?.trim()) {
    throw new ApiErrors(400, "Comment content is required");
  }

  if (content.trim().length > 500) {
    throw new ApiErrors(400, "Comment content cannot exceed 500 characters");
  }

  // Check if tweet exists
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  // Create comment
  const comment = await Comment.create({
    content: content.trim(),
    tweet: tweetId,
    owner: userId,
  });

  // Populate and return comment with user data
  const createdComment = await Comment.findById(comment._id)
    .populate("owner", "username fullName avatar")
    .select("-__v");

  if (!createdComment) {
    throw new ApiErrors(500, "Something went wrong while creating comment");
  }

  res.status(201).json(
    new ApiResponse(201, createdComment, "Comment added successfully")
  );
});

// Get comments for a video
const getVideoComments = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as PaginationOptions;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get comments for video
  const comments = await Comment.find({ video: videoId })
    .populate("owner", "username fullName avatar")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalComments = await Comment.countDocuments({ video: videoId });
  const totalPages = Math.ceil(totalComments / limitNum);

  const paginationData = {
    docs: comments,
    totalDocs: totalComments,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res.status(200).json(
    new ApiResponse(200, paginationData, "Video comments fetched successfully")
  );
});

// Get comments for a tweet
const getTweetComments = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as PaginationOptions;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  // Check if tweet exists
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get comments for tweet
  const comments = await Comment.find({ tweet: tweetId })
    .populate("owner", "username fullName avatar")
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalComments = await Comment.countDocuments({ tweet: tweetId });
  const totalPages = Math.ceil(totalComments / limitNum);

  const paginationData = {
    docs: comments,
    totalDocs: totalComments,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res.status(200).json(
    new ApiResponse(200, paginationData, "Tweet comments fetched successfully")
  );
});

// Update comment
const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!commentId) {
    throw new ApiErrors(400, "Comment ID is required");
  }

  if (!content?.trim()) {
    throw new ApiErrors(400, "Comment content is required");
  }

  if (content.trim().length > 500) {
    throw new ApiErrors(400, "Comment content cannot exceed 500 characters");
  }

  // Find comment and verify ownership
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiErrors(404, "Comment not found");
  }

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You can only update your own comments");
  }

  // Update comment
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content: content.trim() },
    { new: true }
  ).populate("owner", "username fullName avatar");

  res.status(200).json(
    new ApiResponse(200, updatedComment, "Comment updated successfully")
  );
});

// Delete comment
const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!commentId) {
    throw new ApiErrors(400, "Comment ID is required");
  }

  // Find comment and verify ownership
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiErrors(404, "Comment not found");
  }

  if (comment.owner.toString() !== userId.toString()) {
    throw new ApiErrors(403, "You can only delete your own comments");
  }

  // Delete comment
  await Comment.findByIdAndDelete(commentId);

  res.status(200).json(
    new ApiResponse(200, null, "Comment deleted successfully")
  );
});

export {
  addVideoComment,
  addTweetComment,
  getVideoComments,
  getTweetComments,
  updateComment,
  deleteComment,
};