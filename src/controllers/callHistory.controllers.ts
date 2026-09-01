import { Request, Response } from "express";
import Call from "../modals/Call";

export const getCallHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id; // From auth middleware

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .populate("callerId", "name avatar")
      .populate("receiverId", "name avatar")
      .sort({ startTime: -1 })
      .limit(50); // Get last 50 calls

    // Format the response for the frontend
    const formattedCalls = calls.map((call: any) => {
      const isCaller = call.callerId._id.toString() === userId;
      
      let callType = "missed";
      if (call.status === "completed" || call.status === "ongoing") {
        callType = isCaller ? "outgoing" : "incoming";
      } else if (call.status === "rejected") {
        callType = isCaller ? "outgoing" : "missed"; 
      }

      const otherUser = isCaller ? call.receiverId : call.callerId;

      // Format duration
      let durationStr = "";
      if (call.duration) {
        const mins = Math.floor(call.duration / 60);
        const secs = call.duration % 60;
        durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;
      }

      return {
        id: call._id,
        name: otherUser?.name || "Unknown",
        avatar: otherUser?.avatar || "",
        type: callType,
        mode: call.type,
        time: call.startTime, // Frontend will format this
        duration: durationStr || undefined,
        rawStatus: call.status,
      };
    });

    return res.status(200).json(formattedCalls);
  } catch (error) {
    console.error("Error fetching call history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createCallLog = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { receiverId, status, type, duration, startTime, endTime } = req.body;

    if (!receiverId || !type) {
      return res.status(400).json({ message: "Receiver ID and type are required" });
    }

    const newCall = new Call({
      callerId: userId,
      receiverId,
      status: status || "completed",
      type,
      duration,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : undefined,
    });

    await newCall.save();

    return res.status(201).json({ message: "Call log created", call: newCall });
  } catch (error) {
    console.error("Error creating call log:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
