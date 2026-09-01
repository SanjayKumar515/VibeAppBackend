import mongoose, { Document, Schema } from "mongoose";

export interface ICall extends Document {
  callerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: "missed" | "completed" | "rejected" | "ongoing";
  type: "audio" | "video";
  duration?: number; // Duration in seconds
  startTime: Date;
  endTime?: Date;
}

const callSchema: Schema = new Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["missed", "completed", "rejected", "ongoing"],
      default: "ongoing",
    },
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    duration: {
      type: Number, // Stored in seconds
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Call = mongoose.model<ICall>("Call", callSchema);

export default Call;
