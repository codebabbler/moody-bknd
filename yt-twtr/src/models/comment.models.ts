import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { IComment } from "../types";
const commentSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
commentSchema.plugin(mongooseAggregatePaginate);

const Comment = model<IComment>("Comment", commentSchema);
export default Comment;
