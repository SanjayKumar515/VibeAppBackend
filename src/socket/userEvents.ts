import { Server as SocketIOServer, Socket } from "socket.io";
import User from "../modals/User";
import { generateToken } from "../utils/token";

// Utility to remove undefined properties
function cleanUpdateData(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  );
}

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
  socket.on("testSocket", (data) => {
    socket.emit("testSocket", { msg: "its working!!!" });
  });

  socket.on(
    "updateProfile",
    async (data: { name?: string; avatar?: string; about?: string }) => {
      console.log("updateProfile event:", data);

      const userId = socket.data.userId;
      if (!userId) {
        return socket.emit("updateProfile", {
          success: false,
          msg: "Unauthorized",
        });
      }

      try {
        // Only include defined fields in update
        const updateData = cleanUpdateData({
          name: data.name,
          avatar: data.avatar,
          about: data.about,
        });

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
          new: true,
        });

        if (!updatedUser) {
          return socket.emit("updateProfile", {
            success: false,
            msg: "User not found",
          });
        }

        // Generate fresh token for updated profile
        const newToken = generateToken(updatedUser);

        socket.emit("updateProfile", {
          success: true,
          data: { token: newToken },
          msg: "Profile updated successfully",
        });
      } catch (error) {
        console.log("error updating profile:", error);
        socket.emit("updateProfile", {
          success: false,
          msg: "error updating profile",
        });
      }
    },
  );

  socket.on("userOnline", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) return;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatusChanged", { userId, isOnline: true });
    } catch (error) {
      console.log("error userOnline:", error);
    }
  });

  socket.on("userOffline", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) return;
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      io.emit("userStatusChanged", { userId, isOnline: false, lastSeen });
    } catch (error) {
      console.log("error userOffline:", error);
    }
  });

  socket.on("checkUserStatus", async (data) => {
    try {
      const user = await User.findById(data.userId).lean();
      if (user) {
        socket.emit("userStatusResult", {
          userId: user._id.toString(),
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
        });
      }
    } catch (error) {
      console.log("error checkUserStatus:", error);
    }
  });

  socket.on("getContacts", async () => {
    try {
      const currentUserId = socket.data.userId;
      if (!currentUserId) {
        socket.emit("getContacts", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }
      const currentUser = await User.findById(currentUserId).lean();
      const blockedUsers = currentUser?.blockedUsers || [];

      const users = await User.find(
        {
          _id: { $ne: currentUserId, $nin: blockedUsers },
        },
        { password: 0 },
      ).lean();

      const contacts = users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar || "",
        about: user.about || "Hey there! I am using Vibe App.",
        isOnline: user.isOnline || false,
        lastSeen: user.lastSeen || null,
      }));

      socket.emit("getContacts", {
        success: true,
        data: contacts,
      });
    } catch (error: any) {
      console.log("getContacts errors: ", error);
      socket.emit("getContacts", {
        success: false,
        msg: "failed to fetch contacts",
      });
    }
  });

  socket.on("blockUser", async (data: { userIdToBlock: string }) => {
    try {
      const currentUserId = socket.data.userId;
      if (!currentUserId) return;
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { blockedUsers: data.userIdToBlock },
      });
      socket.emit("blockUser", {
        success: true,
        msg: "User blocked successfully",
      });
    } catch (error) {
      console.log("error blockUser:", error);
      socket.emit("blockUser", { success: false, msg: "Failed to block user" });
    }
  });

  socket.on("unblockUser", async (data: { userIdToUnblock: string }) => {
    try {
      const currentUserId = socket.data.userId;
      if (!currentUserId) return;
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { blockedUsers: data.userIdToUnblock },
      });
      socket.emit("unblockUser", {
        success: true,
        msg: "User unblocked successfully",
      });
    } catch (error) {
      console.log("error unblockUser:", error);
      socket.emit("unblockUser", {
        success: false,
        msg: "Failed to unblock user",
      });
    }
  });
}
