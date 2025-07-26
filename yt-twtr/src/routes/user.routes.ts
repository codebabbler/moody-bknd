import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller";
import upload from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").get(refreshAccessToken);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/update-profile").put(verifyJWT, updateUserProfile);
router.route("/change-password").put(verifyJWT, changePassword);
router.route("/update-avatar").put(verifyJWT, updateAvatar);
router.route("/update-cover-image").put(verifyJWT, updateCoverImage);

export default router;
