import { Router } from "express";
import {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getLikedVideos,
  getLikedTweets,
} from "../controllers/like.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Toggle like routes
router.route("/video/:videoId").post(toggleVideoLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);
router.route("/comment/:commentId").post(toggleCommentLike);

// Get liked content routes
router.route("/videos").get(getLikedVideos);
router.route("/tweets").get(getLikedTweets);

export default router;