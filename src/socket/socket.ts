import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer, Socket } from "socket.io";
import { registerUserEvents } from "./userEvents";
import { registerChatEvents } from "./chatEvents";
import { registerCallEvents } from "./callEvents";
import Conversation from "../modals/Conversation";
import User from "../modals/User";

dotenv.config();

// In-memory tracker for user sockets to support multiple connections per user
// Key: userId, Value: Set of socketIds
const userSockets = new Map<string, Set<string>>();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", //allow all rigins
    },
    // Heartbeat/ping mechanism to keep connections alive and detect drops
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e8, // 100 MB buffer for base64 images
  }); // socket io server instance

  // auth middleware

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: no token provided !"));
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          return next(new Error("Authentication error: invalid token  !"));
        }
        // attached user data to socket
        let userData = decoded.user;
        socket.data = userData;
        socket.data.userId = userData.id;
        next();
      },
    );
  });
  // when socket connects , register events
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`user connected : ${userId} on socket ${socket.id}, username:${socket.data.name}`);

    // Track this socket connection for the user
    if (userSockets.has(userId)) {
      // User is already logged in on another device!
      const oldSockets = userSockets.get(userId);
      if (oldSockets) {
        for (const oldSocketId of oldSockets) {
          const oldSocket = io.sockets.sockets.get(oldSocketId);
          if (oldSocket) {
            console.log(`Forcing logout on old socket ${oldSocketId} for user ${userId}`);
            oldSocket.emit("forceLogout", { message: "You have been logged in on another device." });
            oldSocket.disconnect(true);
          }
        }
      }
      userSockets.set(userId, new Set()); // Clear old ones
    } else {
      userSockets.set(userId, new Set());
      
      // This is the first active connection for this user, mark as online
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("userStatusChanged", { userId, isOnline: true });
      } catch (error) {
        console.log("Error updating online status:", error);
      }
    }
    userSockets.get(userId)?.add(socket.id);

    // Join the user to their own personal room for direct signaling (e.g. calls)
    socket.join(userId);

    // register events
    registerChatEvents(io, socket);
    registerUserEvents(io, socket);
    registerCallEvents(io, socket);

    //join all the conversations of user
    try {
      const conversations = await Conversation.find({
        participants: userId,
      }).select("_id");

      conversations.forEach((conversation: any) => {
        socket.join(conversation._id.toString());
      });
    } catch (error: any) {
      console.log("error joining conversation rooms:", error);
    }

    
    socket.on("updateFcmToken", async (fcmToken) => {
      if (userId && fcmToken) {
        try {
          await User.findByIdAndUpdate(userId, { fcmToken });
          console.log(`Updated FCM token for user ${userId}`);
        } catch (e) {
          console.log("Error updating FCM token", e);
        }
      }
    });

    socket.on("disconnect", async () => {
      // Remove this socket from the user's active sockets
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        
        // If the user has no more active sockets, mark them offline
        if (sockets.size === 0) {
          userSockets.delete(userId);
          try {
            const lastSeen = new Date();
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
            io.emit("userStatusChanged", { userId, isOnline: false, lastSeen });
            console.log(
              `user completely disconnected : ${userId}, username:${socket.data.name}`,
            );
          } catch (error) {
            console.log("Error updating offline status:", error);
          }
        }
      }
    });
  });

  return io;
}
