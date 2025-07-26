import { Router } from "express";
import {
  createTweet,
  getAllTweets,
  getTweetById,
  updateTweet,
  deleteTweet,
  getUserTweets,
} from "../controllers/tweet.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.route("/").get(getAllTweets);
router.route("/:tweetId").get(getTweetById);
router.route("/user/:userId").get(getUserTweets);

// Protected routes (require authentication)
router.route("/").post(verifyJWT, createTweet);
router.route("/:tweetId").patch(verifyJWT, updateTweet);
router.route("/:tweetId").delete(verifyJWT, deleteTweet);

export default router;