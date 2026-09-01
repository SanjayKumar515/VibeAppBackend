import { Server as SocketIOServer, Socket } from "socket.io";
import User from "../modals/User";

export function registerCallEvents(io: SocketIOServer, socket: Socket) {
  // Initiate a call
  socket.on("initiateCall", async (data: { targetUserId: string; type: "audio" | "video"; chatId?: string }) => {
    try {
      const callerId = socket.data.userId;
      const caller = await User.findById(callerId).select("name avatar phoneNumber");
      
      if (!caller) return;

      // Notify the target user about the incoming call
      io.to(data.targetUserId).emit("incomingCall", {
        callerId: callerId,
        caller: caller,
        type: data.type,
        chatId: data.chatId,
      });
      
    } catch (error) {
      console.log("Error in initiateCall:", error);
    }
  });

  // Accept a call
  socket.on("acceptCall", (data: { callerId: string }) => {
    try {
      const responderId = socket.data.userId;
      // Tell the caller that their call was accepted
      io.to(data.callerId).emit("callAccepted", {
        responderId: responderId,
      });
    } catch (error) {
      console.log("Error in acceptCall:", error);
    }
  });

  // Reject a call
  socket.on("rejectCall", (data: { callerId: string }) => {
    try {
      const responderId = socket.data.userId;
      // Tell the caller that their call was rejected
      io.to(data.callerId).emit("callRejected", {
        responderId: responderId,
      });
    } catch (error) {
      console.log("Error in rejectCall:", error);
    }
  });

  // End a call (can be triggered by either party)
  socket.on("endCall", (data: { targetUserId: string }) => {
    try {
      // Notify the other party that the call has ended
      io.to(data.targetUserId).emit("callEnded", {
        endedBy: socket.data.userId,
      });
    } catch (error) {
      console.log("Error in endCall:", error);
    }
  });

  // WebRTC Signaling (Offer, Answer, ICE Candidates)
  socket.on("webrtcSignal", (data: { targetUserId: string; signal: any }) => {
    try {
      // Forward the signaling data to the target user
      io.to(data.targetUserId).emit("webrtcSignal", {
        senderId: socket.data.userId,
        signal: data.signal,
      });
    } catch (error) {
      console.log("Error in webrtcSignal:", error);
    }
  });
}
