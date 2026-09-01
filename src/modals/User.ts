import { Schema, model } from "mongoose";
import { UserProps } from "../types";

const UserSchema = new Schema<UserProps>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  fcmToken: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  name: {
    type: String,
    default: "",
  },

  avatar: {
    type: String,
    default: "",
  },
  about: {
    type: String,
    default: "Hey there! I am using Vibe App.",
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
  },
  created: {
    type: String,
    default: Date.now,
  },
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

export default model<UserProps>("User", UserSchema);
