import mongoose, { Document, Schema } from "mongoose";

export interface IStatus extends Document {
  userId: mongoose.Types.ObjectId;
  media: string;
  caption?: string;
  viewers: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const statusSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: String, // base64 or URL
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB will automatically delete documents after 24 hours (86400 seconds)
    },
  },
  {
    timestamps: true,
  }
);

const Status = mongoose.model<IStatus>("Status", statusSchema);

export default Status;
