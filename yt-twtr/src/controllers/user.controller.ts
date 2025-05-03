import asyncHandler from "../utils/asyncHandler";
import ApiErrors from "../utils/ApiErrors";
import User from "../models/user.model";
import uploadOnCloudinary from "../utils/cloudinary";

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

  if (
    [fullName, username, email, password].some(
      (field) => field?.trim === undefined
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
  const files = req.files as {
    avatar?: Express.Multer.File[];
    coverImage?: Express.Multer.File[];
  };
  const avatarLocalPath = files.avatar?.[0]?.path ?? null;
  const coverImageLocalPath = files.coverImage?.[0]?.path ?? null;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar image is required");
  }

  console.log("req.files: ", req.files);
});

export { registerUser };
