import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import User from "../models/user.model";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/ApiResponse";
import JWT from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
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

  //for ts type error bs
  // const files = req.files as {
  //   avatar?: Express.Multer.File[];
  //   coverImage?: Express.Multer.File[];
  // };

  //GPT fix:
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  // const rawFiles = req.files ?? {};
  // const files = {
  //   avatar: rawFiles["avatar"],
  //   coverImage: rawFiles["coverImage"],
  // };

  const avatarLocalPath = files.avatar?.[0]?.path ?? null;
  const coverImageLocalPath = files.coverImage?.[0]?.path ?? null;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar image is required");
  }

  // Upload avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiErrors(500, "Avatar upload failed. Please try again.");
  }

  // Upload cover image if provided
  let coverImage = null;
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
});

const loginUser = asyncHandler(async (req, res) => {
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
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loggedInUser) {
    throw new ApiErrors(500, "Something went wrong while logging in");
  }

  const options = {
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
});

const logoutUser = asyncHandler(async (req: any, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
    new: true,
  });
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const generateAccessAndRefreshToken = async (userID: string) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrors(500, "Something went wrong while generating tokens");
  }
};

const refreshAccessToken = asyncHandler(async (req, res: any) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrors(401, "unauthorized access, no refresh token provided");
  }
  try {
    const decodedToken = JWT.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JWT.JwtPayload;
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiErrors(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiErrors(401, "Refresh token is invalid or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    return res
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
  } catch (error: any) {
    throw new ApiErrors(401, error?.message || "Unauthorized access");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
