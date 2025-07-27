import { Schema, model } from "mongoose";
import { IDislike } from "../types";

const dislikeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: false, // Optional, as dislikes can be for videos, tweets, or comments
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      required: false, // Optional, as dislikes can be for videos, tweets, or comments
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: false, // Optional, as dislikes can be for videos, tweets, or comments
    },
    dislikedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for performance and uniqueness
dislikeSchema.index({ video: 1, dislikedBy: 1 }, { unique: true, sparse: true });
dislikeSchema.index({ tweet: 1, dislikedBy: 1 }, { unique: true, sparse: true });
dislikeSchema.index({ comment: 1, dislikedBy: 1 }, { unique: true, sparse: true });

const Dislike = model<IDislike>("Dislike", dislikeSchema);
export default Dislike;