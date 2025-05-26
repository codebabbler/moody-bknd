import { Schema, model } from "mongoose";
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //who0 is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //who is being subscribed to

      // channel is a user, so we reference the User model
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;
