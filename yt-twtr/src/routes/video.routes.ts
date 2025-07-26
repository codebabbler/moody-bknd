import { Router } from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getUserVideos,
  incrementViews,
} from "../controllers/video.controller";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";

const router = Router();

// Public routes (with optional auth for better user experience)
router.route("/").get(optionalAuth, getAllVideos); // GET /videos - Get all published videos
router.route("/:videoId").get(optionalAuth, getVideoById); // GET /videos/:videoId - Get video by ID
router.route("/:videoId/view").patch(incrementViews); // PATCH /videos/:videoId/view - Increment view count
router.route("/user/:userId").get(optionalAuth, getUserVideos); // GET /videos/user/:userId - Get user's videos

// Protected routes (require authentication)
router.use(verifyJWT); // Apply authentication middleware to all routes below

router.route("/upload").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
); // POST /videos/upload - Upload new video

router.route("/:videoId").patch(updateVideo); // PATCH /videos/:videoId - Update video
router.route("/:videoId").delete(deleteVideo); // DELETE /videos/:videoId - Delete video
router.route("/:videoId/toggle-publish").patch(togglePublishStatus); // PATCH /videos/:videoId/toggle-publish - Toggle publish status

export default router;