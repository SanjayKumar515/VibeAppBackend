import { Server as SocketIOServer, Socket } from "socket.io";
import User from "../modals/User";
import { getMessaging } from "firebase-admin/messaging";

import Call from "../modals/Call";

export function registerCallEvents(io: SocketIOServer, socket: Socket) {
  // Initiate a call
  socket.on("initiateCall", async (data: { targetUserId: string; type: "audio" | "video"; chatId?: string }) => {
    try {
      const callerId = socket.data.userId;
      const caller = await User.findById(callerId).select("name avatar phoneNumber");
      
      if (!caller) return;

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
      io.to(data.callerId).emit("callRejected", {
        responderId: responderId,
      });
    } catch (error) {
      console.log("Error in rejectCall:", error);
    }
  });

  // End a call (can be triggered by either party)
  socket.on("endCall", async (data: { targetUserId?: string; to?: string }) => {
    try {
      const target = data.targetUserId || data.to;
      const userId = socket.data.userId;

      // Update call in DB
      if (target && userId) {
         // find the most recent ongoing call between these two
         const recentCall = await Call.findOne({
            $or: [
              { callerId: userId, receiverId: target },
              { callerId: target, receiverId: userId }
            ],
            status: "ongoing"
         }).sort({ startTime: -1 });

         if (recentCall) {
            recentCall.endTime = new Date();
            // Calculate duration in seconds
            const durationInSeconds = Math.floor((recentCall.endTime.getTime() - recentCall.startTime.getTime()) / 1000);
            recentCall.duration = durationInSeconds;
            
            // if duration is very small (e.g. < 2 seconds) or not answered, maybe missed/rejected, 
            // but we'll mark it as completed here if it's ongoing
            recentCall.status = "completed";
            await recentCall.save();
         }
      }

      if (target) {
        io.to(target).emit("callEnded", {
          endedBy: userId,
        });
      }
    } catch (error) {
      console.log("Error in endCall:", error);
    }
  });

  // WebRTC Signaling (Offer, Answer, ICE Candidates)
  socket.on("webrtcSignal", (data: { targetUserId: string; signal: any }) => {
    try {
      io.to(data.targetUserId).emit("webrtcSignal", {
        senderId: socket.data.userId,
        signal: data.signal,
      });
    } catch (error) {
      console.log("Error in webrtcSignal:", error);
    }
  });

  // Events emitted by frontend
  socket.on("callUser", async (data) => {
    try {
      // Create new Call record
      const type = data.type || "video"; // fallback to video if not provided
      await Call.create({
        callerId: String(data.from || ''),
        receiverId: data.userToCall,
        type: type,
        status: "ongoing", // starts as ongoing
        startTime: new Date()
      });

      io.to(data.userToCall).emit("incomingCall", {
        from: data.from,
        name: data.name,
        avatar: data.avatar,
                signal: data.signalData,
        type: type,
      });

      // Send Push Notification
      const targetUser = await User.findById(data.userToCall).select("fcmToken");
      if (targetUser && targetUser.fcmToken) {
        const message = {
          data: {
            type: 'INCOMING_CALL',
            callerId: String(data.from || ''),
            callerName: String(data.name || 'Unknown'),
            callerAvatar: String(data.avatar || ''),
            callType: String(type || 'video'),
            signalData: JSON.stringify(data.signalData || {}),
          },
          android: {
            priority: 'high' as 'high',
          },
          token: targetUser.fcmToken
        };
        try {
          await getMessaging().send(message);
        } catch (fcmError) {
          console.log("FCM send failed for call:", fcmError);
        }
      }
    } catch (error) {
      console.log("Error in callUser:", error);
    }
  });

  socket.on("answerCall", async (data) => {
    try {
      const userId = socket.data.userId;
      const callerId = data.to; // The one who called us

      if (userId && callerId) {
         // We can optionally mark it as 'answered' or something here, 
         // but status="ongoing" is already set when callUser was called.
      }

      io.to(data.to).emit("callAccepted", {
        signal: data.signal,
      });
    } catch (error) {
      console.log("Error in answerCall:", error);
    }
  });

  socket.on("iceCandidate", (data) => {
    try {
      io.to(data.to).emit("iceCandidate", {
        candidate: data.candidate,
      });
    } catch (error) {
      console.log("Error in iceCandidate:", error);
    }
  });

  socket.on("getCallHistory", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("getCallHistory", { success: false, msg: "User not authenticated" });
        return;
      }

      const calls = await Call.find({
        $or: [{ callerId: userId }, { receiverId: userId }],
      })
      .sort({ startTime: -1 })
      .populate("callerId", "name avatar phoneNumber")
      .populate("receiverId", "name avatar phoneNumber")
      .lean();

      socket.emit("getCallHistory", { success: true, data: calls });
    } catch (error) {
      console.log("Error in getCallHistory:", error);
      socket.emit("getCallHistory", { success: false, msg: "Failed to fetch call history" });
    }
  });
}
