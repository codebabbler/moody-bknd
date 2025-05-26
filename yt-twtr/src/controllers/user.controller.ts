import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import User from "../models/user.model";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/ApiResponse";

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
  console.log("fullName: ", fullName);
  console.log("username: ", username);
  console.log("email: ", email);
  console.log("password: ", password);
  console.log("req.files: ", req.files);

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

export { registerUser };
