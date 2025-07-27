import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import ApiResponse from "../utils/ApiResponse";
import Like from "../models/like.models";
import Video from "../models/video.models";
import Tweet from "../models/tweet.models";
import Comment from "../models/comment.models";
import { AuthenticatedRequest, PaginationOptions } from "../types";

// Toggle video like
const toggleVideoLike = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  // Check if video exists
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  if (existingLike) {
    // Unlike: Remove like record
    await Like.findByIdAndDelete(existingLike._id);

    res.status(200).json(
      new ApiResponse(200, { liked: false }, "Video unliked successfully")
    );
  } else {
    // Like: Create new like record
    await Like.create({
      video: videoId,
      likedBy: userId,
    });

    res.status(200).json(
      new ApiResponse(200, { liked: true }, "Video liked successfully")
    );
  }
});

// Toggle tweet like
const toggleTweetLike = asyncHandler(async (req: Request, res: Response) => {
  const { tweetId } = req.params;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!tweetId) {
    throw new ApiErrors(400, "Tweet ID is required");
  }

  // Check if tweet exists
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiErrors(404, "Tweet not found");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (existingLike) {
    // Unlike: Remove like record
    await Like.findByIdAndDelete(existingLike._id);

    res.status(200).json(
      new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
    );
  } else {
    // Like: Create new like record
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    res.status(200).json(
      new ApiResponse(200, { liked: true }, "Tweet liked successfully")
    );
  }
});

// Toggle comment like
const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = (req as AuthenticatedRequest).user._id;

  if (!commentId) {
    throw new ApiErrors(400, "Comment ID is required");
  }

  // Check if comment exists
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiErrors(404, "Comment not found");
  }

  // Check if like already exists
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    // Unlike: Remove like record
    await Like.findByIdAndDelete(existingLike._id);

    res.status(200).json(
      new ApiResponse(200, { liked: false }, "Comment unliked successfully")
    );
  } else {
    // Like: Create new like record
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    res.status(200).json(
      new ApiResponse(200, { liked: true }, "Comment liked successfully")
    );
  }
});

// Get liked videos by user
const getLikedVideos = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user._id;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as PaginationOptions;

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get liked videos
  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true },
  })
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "username fullName avatar",
      },
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalLikes = await Like.countDocuments({
    likedBy: userId,
    video: { $exists: true },
  });
  const totalPages = Math.ceil(totalLikes / limitNum);

  const paginationData = {
    docs: likedVideos.map((like) => like.video),
    totalDocs: totalLikes,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res.status(200).json(
    new ApiResponse(200, paginationData, "Liked videos fetched successfully")
  );
});

// Get liked tweets by user
const getLikedTweets = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user._id;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query as PaginationOptions;

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Calculate pagination
  const pageNum = parseInt(page.toString());
  const limitNum = parseInt(limit.toString());
  const skip = (pageNum - 1) * limitNum;

  // Get liked tweets
  const likedTweets = await Like.find({
    likedBy: userId,
    tweet: { $exists: true },
  })
    .populate({
      path: "tweet",
      populate: {
        path: "user",
        select: "username fullName avatar",
      },
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  // Get total count for pagination
  const totalLikes = await Like.countDocuments({
    likedBy: userId,
    tweet: { $exists: true },
  });
  const totalPages = Math.ceil(totalLikes / limitNum);

  const paginationData = {
    docs: likedTweets.map((like) => like.tweet),
    totalDocs: totalLikes,
    limit: limitNum,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage: pageNum < totalPages ? pageNum + 1 : null,
    prevPage: pageNum > 1 ? pageNum - 1 : null,
  };

  res.status(200).json(
    new ApiResponse(200, paginationData, "Liked tweets fetched successfully")
  );
});

export {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getLikedVideos,
  getLikedTweets,
};