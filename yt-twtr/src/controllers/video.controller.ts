import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import ApiResponse from "../utils/ApiResponse";
import Video from "../models/video.model";
import User from "../models/user.model";
import uploadOnCloudinary, { uploadVideoOnCloudinary } from "../utils/cloudinary";
import {
  CreateVideoRequest,
  UpdateVideoRequest,
  MulterFiles,
  CloudinaryUploadResult,
  PaginationOptions,
  AuthenticatedRequest,
} from "../types";
import { getVideoDuration } from "../utils/videoUtils";

// Upload video with thumbnail
const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, isPublished = true } = req.body as CreateVideoRequest;
  const files = req.files as MulterFiles;

  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    throw new ApiErrors(400, "Title and description are required");
  }


  // Check for video file
  const videoFileLocalPath = files.videoFile?.[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiErrors(400, "Video file is required");
  }

  // Check for thumbnail (optional)
  const thumbnailLocalPath = files.thumbnail?.[0]?.path;

  try {
    // Extract video duration
    const duration = await getVideoDuration(videoFileLocalPath);
    
    // Upload video to Cloudinary
    const videoUploadResult: CloudinaryUploadResult | null = await uploadVideoOnCloudinary(videoFileLocalPath);
    if (!videoUploadResult) {
      throw new ApiErrors(500, "Failed to upload video. Please try again.");
    }

    // Upload thumbnail to Cloudinary (if provided)
    let thumbnailUploadResult: CloudinaryUploadResult | null = null;
    if (thumbnailLocalPath) {
      thumbnailUploadResult = await uploadOnCloudinary(thumbnailLocalPath);
    }

    // Create video record in database
    const video = await Video.create({
      videoFile: videoUploadResult.secure_url,
      thumbnail: thumbnailUploadResult?.secure_url || videoUploadResult.secure_url, // Use video URL as fallback
      title: title.trim(),
      description: description.trim(),
      duration,
      isPublished: Boolean(isPublished),
      owner: (req as AuthenticatedRequest).user._id,
    });

    // Fetch the created video with owner details
    const createdVideo = await Video.findById(video._id)
      .populate("owner", "username fullName avatar")
      .select("-__v");

    if (!createdVideo) {
      throw new ApiErrors(500, "Something went wrong while creating video record");
    }

    res.status(201).json(
      new ApiResponse(201, createdVideo, "Video uploaded successfully")
    );
  } catch (error) {
    // Clean up files in case of error
    if (videoFileLocalPath && require('fs').existsSync(videoFileLocalPath)) {
      require('fs').unlinkSync(videoFileLocalPath);
    }
    if (thumbnailLocalPath && require('fs').existsSync(thumbnailLocalPath)) {
      require('fs').unlinkSync(thumbnailLocalPath);
    }
    throw error;
  }
});

// Get all videos with pagination and filtering
const getAllVideos = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    searchQuery,
  } = req.query as PaginationOptions & {
    userId?: string;
    searchQuery?: string;
  };

  // Build match conditions
  const matchConditions: any = {
    isPublished: true, // Only show published videos
  };

  // Filter by user if specified
  if (userId) {
    matchConditions.owner = userId;
  }

  // Add search functionality
  if (searchQuery) {
    matchConditions.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
    ];
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Aggregation pipeline
  const aggregationPipeline = [
    { $match: matchConditions },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: sortOptions,
    },
  ];

  const options = {
    page: parseInt(page.toString()),
    limit: parseInt(limit.toString()),
  };

  const videos = await Video.aggregatePaginate(
    Video.aggregate(aggregationPipeline),
    options
  );

  res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );
});

// Get video by ID
const getVideoById = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  const video = await Video.findById(videoId)
    .populate("owner", "username fullName avatar")
    .select("-__v");

  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  // Check if video is published or if user is the owner
  if (!video.isPublished && req.user && video.owner._id.toString() !== req.user._id.toString()) {
    throw new ApiErrors(403, "This video is not available");
  }

  res.status(200).json(
    new ApiResponse(200, video, "Video fetched successfully")
  );
});

// Update video details
const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  const { title, description, isPublished } = req.body as UpdateVideoRequest;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  // Find video and verify ownership
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (video.owner.toString() !== (req as AuthenticatedRequest).user._id.toString()) {
    throw new ApiErrors(403, "You can only update your own videos");
  }

  // Update fields
  const updateFields: any = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (description !== undefined) updateFields.description = description.trim();
  if (isPublished !== undefined) updateFields.isPublished = Boolean(isPublished);

  // Validate required fields if being updated
  if (updateFields.title && !updateFields.title) {
    throw new ApiErrors(400, "Title cannot be empty");
  }
  if (updateFields.description && !updateFields.description) {
    throw new ApiErrors(400, "Description cannot be empty");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateFields },
    { new: true }
  ).populate("owner", "username fullName avatar");

  res.status(200).json(
    new ApiResponse(200, updatedVideo, "Video updated successfully")
  );
});

// Delete video
const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  // Find video and verify ownership
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (video.owner.toString() !== (req as AuthenticatedRequest).user._id.toString()) {
    throw new ApiErrors(403, "You can only delete your own videos");
  }

  // Delete video from database
  await Video.findByIdAndDelete(videoId);

  res.status(200).json(
    new ApiResponse(200, null, "Video deleted successfully")
  );
});

// Toggle video publish status
const togglePublishStatus = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  // Find video and verify ownership
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (video.owner.toString() !== (req as AuthenticatedRequest).user._id.toString()) {
    throw new ApiErrors(403, "You can only modify your own videos");
  }

  // Toggle publish status
  video.isPublished = !video.isPublished;
  await video.save();

  const updatedVideo = await Video.findById(videoId)
    .populate("owner", "username fullName avatar");

  res.status(200).json(
    new ApiResponse(
      200,
      updatedVideo,
      `Video ${video.isPublished ? "published" : "unpublished"} successfully`
    )
  );
});

// Get user's own videos (including unpublished)
const getUserVideos = asyncHandler(async (req: Request, res: Response) => {
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

  // Build match conditions
  const matchConditions: any = { owner: userId };

  // If requesting user's own videos, show all. Otherwise, only published
  if (!req.user || req.user._id.toString() !== userId) {
    matchConditions.isPublished = true;
  }

  // Build sort object
  const sortOrder = sortType === "desc" ? -1 : 1;
  const sortOptions: any = {};
  sortOptions[sortBy] = sortOrder;

  // Aggregation pipeline
  const aggregationPipeline = [
    { $match: matchConditions },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: sortOptions,
    },
  ];

  const options = {
    page: parseInt(page.toString()),
    limit: parseInt(limit.toString()),
  };

  const videos = await Video.aggregatePaginate(
    Video.aggregate(aggregationPipeline),
    options
  );

  res.status(200).json(
    new ApiResponse(200, videos, "User videos fetched successfully")
  );
});

// Increment view count
const incrementViews = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiErrors(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiErrors(404, "Video not found");
  }

  if (!video.isPublished) {
    throw new ApiErrors(403, "Cannot view unpublished video");
  }

  // Increment view count
  video.views = (video.views || 0) + 1;
  await video.save();

  res.status(200).json(
    new ApiResponse(200, { views: video.views }, "View count updated")
  );
});

export {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getUserVideos,
  incrementViews,
};