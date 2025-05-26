import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //URI (COULD BE AWS S3) OR SOME OTHER CDN
      required: true,
    },
    coverImage: {
      type: String, //URI (COULD BE AWS S3) OR SOME OTHER CDN
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

// if (
//   !process.env.ACCESS_TOKEN_SECRET ||
//   !process.env.REFRESH_TOKEN_SECRET ||
//   !process.env.ACCESS_TOKEN_EXPIRY ||
//   !process.env.REFRESH_TOKEN_EXPIRY
// ) {
//   throw new Error(
//     "ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, and REFRESH_TOKEN_EXPIRY must be defined in the .env file"
//   );
// }

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET ?? "secteytdsrgfg",
    // {
    //   expiresIn: process.env.ACCESS_TOKEN_EXPIRY! as any,
    // }
    { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY ?? "86400000") }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY! as any,
    }
  );
};
const User = model("User", userSchema);
export default User;
