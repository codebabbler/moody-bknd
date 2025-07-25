import { Schema, model } from "mongoose";
import { ILike } from "../types";
const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: false, // Optional, as likes can be for videos, tweets, or comments
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      required: false, // Optional, as likes can be for videos, tweets, or comments
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false, // Optional, as likes can be for videos, tweets, or comments
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Like = model<ILike>("Like", likeSchema);
export default Like;
