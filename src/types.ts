import { Document, Types } from "mongoose";

export interface UserProps extends Document {
  phoneNumber: string;
  fcmToken?: string;
  otp?: string;
  otpExpiresAt?: Date;
  name?: string;
  avatar?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  created?: Date;
  blockedUsers?: Types.ObjectId[];
}

export interface ConversationProps extends Document {
  _id: Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  unreadCounts?: Map<string, number>;
}
