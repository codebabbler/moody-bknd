import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import User from "../models/user.model";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/ApiResponse";
import JWT from "jsonwebtoken";
import {
  RegisterUserRequest,
  LoginUserRequest,
  ChangePasswordRequest,
  UpdateUserProfileRequest,
  TokenPayload,
  MulterFiles,
  CloudinaryUploadResult,
  CookieOptions,
  AuthenticatedRequest,
} from "../types";

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

const generateAccessAndRefreshToken = async (
  userID: string
): Promise<TokenResponse> => {
  try {
    const user = await User.findById(userID);
    if (!user) {
      throw new ApiErrors(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(
  async (req: Request<{}, {}, RegisterUserRequest>, res: Response) => {
    //get user details from frontend (req.body)
    //validate user details
    //check if user already exists: unique email or username (send error)
    //if user does not exist, create user
    //check for images,avatar
    //upload images to Cloudinary
    //create user object - user entry in DB
    //remove password and refresh token from response
    //check if user is created
    //send success response

    const { fullName, username, email, password } = req.body;
    // console.log("fullName: ", fullName);
    // console.log("username: ", username);
    // console.log("email: ", email);
    // console.log("password: ", password);
    // console.log("req.files: ", JSON.stringify(req.files, null, 2));

    // Validate required fields
    if (
      [fullName, username, email, password].some(
        (field) => field === undefined || field === null || field.trim() === ""
      )
    ) {
      throw new ApiErrors(400, "All fields are required");
    }

    const existedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existedUser) {
      throw new ApiErrors(409, "User with email or username already exists");
    }

    const files = req.files as MulterFiles;

    const avatarLocalPath = files.avatar?.[0]?.path ?? null;
    const coverImageLocalPath = files.coverImage?.[0]?.path ?? null;

    if (!avatarLocalPath) {
      throw new ApiErrors(400, "Avatar image is required");
    }

    // Upload avatar to cloudinary
    const avatar: CloudinaryUploadResult | null =
      await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
      throw new ApiErrors(500, "Avatar upload failed. Please try again.");
    }

    // Upload cover image if provided
    let coverImage: CloudinaryUploadResult | null = null;
    if (coverImageLocalPath) {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      // Not blocking registration if cover image upload fails
    }
    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url ?? null,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiErrors(500, "Something went wrong while registering user");
    }

    console.log("req.files: ", req.files);
    res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User created successfully"));
    return;
  }
);

const loginUser = asyncHandler(
  async (req: Request<{}, {}, LoginUserRequest>, res: Response) => {
    const { email, username, password } = req.body;
    console.log(email, username, password);

    if (!email && !username) {
      throw new ApiErrors(400, "Please provide email or username");
    }
    const user = await User.findOne({
      $or: [{ email: email }, { username: username?.toLowerCase() }],
    });
    if (!user) {
      throw new ApiErrors(404, "User does not exist");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      throw new ApiErrors(401, "Invalid credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      String(user._id)
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!loggedInUser) {
      throw new ApiErrors(500, "Something went wrong while logging in");
    }

    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "User logged in successfully"
        )
      );
  }
);

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    (req as AuthenticatedRequest).user._id,
    {
      $unset: { refreshToken: 1 },
    },
    {
      new: true,
    }
  );
  const options: CookieOptions = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "unauthorized access, no refresh token provided");
  }
  try {
    const decodedToken = JWT.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET ?? "refreshsecret"
    ) as TokenPayload;
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiErrors(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiErrors(401, "Refresh token is invalid or used");
    }
    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      String(user._id)
    );
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user,
            accessToken,
            refreshToken,
          },
          "Access token refreshed successfully"
        )
      );
    return;
  } catch (error: any) {
    throw new ApiErrors(401, error?.message || "Unauthorized access");
  }
});

const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body as ChangePasswordRequest;
  const user = await User.findById((req as AuthenticatedRequest).user._id);
  if (!user) {
    throw new ApiErrors(404, "User not found");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiErrors(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });
  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        (req as AuthenticatedRequest).user,
        "User profile fetched successfully"
      )
    );
});

const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, username, email } = req.body as UpdateUserProfileRequest;
  const user = await User.findById(
    (req as AuthenticatedRequest).user._id
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiErrors(404, "User not found");
  }
  if (fullName) user.fullName = fullName;
  if (username) user.username = username.toLowerCase();
  if (email) user.email = email.toLowerCase();

  await user.save({ validateBeforeSave: true });
  res

    .status(200)
    .json(new ApiResponse(200, user, "User profile updated successfully"));
  return;
});

const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar image is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.url) {
    throw new ApiErrors(400, "Error uploading avatar image");
  }
  const user = await User.findByIdAndUpdate(
    (req as AuthenticatedRequest).user._id,
    { avatar: avatar.url },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));

  return;
});

const updateCoverImage = asyncHandler(async (req: Request, res: Response) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiErrors(400, "Cover image is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage?.url) {
    throw new ApiErrors(400, "Error uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    (req as AuthenticatedRequest).user._id,
    { coverImage: coverImage.url },
    { new: true }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));

  return;
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  updateCoverImage,
};
