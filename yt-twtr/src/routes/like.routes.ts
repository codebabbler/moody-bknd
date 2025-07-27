import { Router } from "express";
import {
  toggleVideoLike,
  toggleTweetLike,
  toggleCommentLike,
  getLikedVideos,
  getLikedTweets,
  toggleVideoDislike,
  toggleTweetDislike,
  toggleCommentDislike,
  getDislikedVideos,
  getDislikedTweets,
} from "../controllers/like.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Toggle like routes
router.route("/video/:videoId").post(toggleVideoLike);
router.route("/tweet/:tweetId").post(toggleTweetLike);
router.route("/comment/:commentId").post(toggleCommentLike);

// Toggle dislike routes
router.route("/dislike/video/:videoId").post(toggleVideoDislike);
router.route("/dislike/tweet/:tweetId").post(toggleTweetDislike);
router.route("/dislike/comment/:commentId").post(toggleCommentDislike);

// Get liked content routes
router.route("/videos").get(getLikedVideos);
router.route("/tweets").get(getLikedTweets);

// Get disliked content routes
router.route("/dislike/videos").get(getDislikedVideos);
router.route("/dislike/tweets").get(getDislikedTweets);

export default router;