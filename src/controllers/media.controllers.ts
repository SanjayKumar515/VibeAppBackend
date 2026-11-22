import { Request, Response } from "express";
import Media from "../modals/Media";

export const uploadMedia = async (req: any, res: Response): Promise<void> => {
  try {
    const { image, filename } = req.body;

    if (!image || typeof image !== "string") {
      res.status(400).json({ success: false, msg: "Image data is required" });
      return;
    }

    // Extract mime type and base64 buffer
    let contentType = "image/jpeg";
    let base64String = image;

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        base64String = matches[2];
      }
    }

    const buffer = Buffer.from(base64String, "base64");

    const newMedia = new Media({
      contentType,
      data: buffer,
      filename: filename || `media_${Date.now()}.jpg`,
      size: buffer.length,
      uploadedBy: req.user?.id || req.user?._id,
    });

    await newMedia.save();

    // Generate Universal HTTPS URL
    const host = req.get("host") || "vibeappbackend.onrender.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const universalUrl = `${protocol}://${host}/api/media/${newMedia._id}`;

    res.status(201).json({
      success: true,
      url: universalUrl,
      mediaId: newMedia._id,
      size: buffer.length,
      contentType,
    });
  } catch (error: any) {
    console.error("Upload media error:", error);
    res.status(500).json({ success: false, msg: "Failed to upload media" });
  }
};

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);

    if (!media || !media.data) {
      res.status(404).json({ success: false, msg: "Image not found" });
      return;
    }

    res.set("Content-Type", media.contentType || "image/jpeg");
    res.set("Content-Length", media.data.length.toString());
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(media.data);
  } catch (error: any) {
    console.error("Get media error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

