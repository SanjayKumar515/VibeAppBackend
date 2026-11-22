import mongoose, { Document, Schema } from "mongoose";

export interface IMedia extends Document {
  contentType: string;
  data: Buffer;
  filename?: string;
  size: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const mediaSchema: Schema = new Schema(
  {
    contentType: {
      type: String,
      default: "image/jpeg",
    },
    data: {
      type: Buffer,
      required: true,
    },
    filename: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Media = mongoose.model<IMedia>("Media", mediaSchema);
export default Media;
