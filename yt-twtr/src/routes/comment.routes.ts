import { Router } from "express";
import {
  addVideoComment,
  addTweetComment,
  getVideoComments,
  getTweetComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no authentication required for reading comments)
router.route("/video/:videoId").get(getVideoComments);
router.route("/tweet/:tweetId").get(getTweetComments);

// Protected routes (require authentication)
router.route("/video/:videoId").post(verifyJWT, addVideoComment);
router.route("/tweet/:tweetId").post(verifyJWT, addTweetComment);
router.route("/:commentId").patch(verifyJWT, updateComment);
router.route("/:commentId").delete(verifyJWT, deleteComment);

export default router;