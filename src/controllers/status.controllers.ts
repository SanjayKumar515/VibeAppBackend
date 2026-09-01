import { Request, Response } from "express";
import Status from "../modals/Status";
import User from "../modals/User";

export const createStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const { media, caption } = req.body;

    if (!media) {
      return res.status(400).json({ message: "Media is required for a status update" });
    }

    const newStatus = new Status({
      userId,
      media,
      caption: caption || "",
      viewers: [],
    });

    await newStatus.save();

    return res.status(201).json({ message: "Status created successfully", status: newStatus });
  } catch (error) {
    console.error("Error creating status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStatuses = async (req: Request, res: Response): Promise<any> => {
  try {
    const currentUserId = (req as any).user.id;
    
    // Get all active statuses (createdAt > 24 hours ago is handled by TTL index)
    // but just in case, we query for recent ones to be safe
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const statuses = await Status.find({ createdAt: { $gte: twentyFourHoursAgo } })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });

    // Group by user
    const userGroups: { [key: string]: any } = {};

    statuses.forEach((status: any) => {
      const uId = status.userId._id.toString();
      
      // Determine if the current user has viewed this specific status
      const hasViewed = status.viewers.some((viewerId: any) => viewerId.toString() === currentUserId);

      const statusItem = {
        id: status._id,
        media: status.media,
        caption: status.caption,
        createdAt: status.createdAt,
        isRead: hasViewed,
      };

      if (!userGroups[uId]) {
        userGroups[uId] = {
          user: {
            id: status.userId._id,
            name: status.userId.name,
            avatar: status.userId.avatar,
          },
          statuses: [statusItem],
          // A user group is only considered "fully read" if ALL their statuses have been viewed
          allRead: hasViewed,
        };
      } else {
        userGroups[uId].statuses.push(statusItem);
        // If any status in the group is unread, the group is not allRead
        if (!hasViewed) {
          userGroups[uId].allRead = false;
        }
      }
    });

    // Separate "My Status" and others
    let myStatus = null;
    const othersStatuses = [];

    for (const [key, group] of Object.entries(userGroups)) {
      // Sort statuses inside the group so the oldest is first (like WhatsApp playback order)
      group.statuses.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      if (key === currentUserId) {
        myStatus = group;
      } else {
        othersStatuses.push(group);
      }
    }

    // Sort others: Unread groups first, then Read groups, sorted by the latest status in the group
    othersStatuses.sort((a, b) => {
      if (a.allRead === b.allRead) {
        // Compare the latest status in each group (which is the last one after the sort above)
        const aLatest = new Date(a.statuses[a.statuses.length - 1].createdAt).getTime();
        const bLatest = new Date(b.statuses[b.statuses.length - 1].createdAt).getTime();
        return bLatest - aLatest; // Newer first
      }
      return a.allRead ? 1 : -1; // Unread first
    });

    return res.status(200).json({
      success: true,
      data: {
        myStatus,
        recentUpdates: othersStatuses,
      }
    });

  } catch (error) {
    console.error("Error fetching statuses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const viewStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const currentUserId = (req as any).user.id;
    const { statusId } = req.params;

    await Status.findByIdAndUpdate(statusId, {
      $addToSet: { viewers: currentUserId } // $addToSet prevents duplicates
    });

    return res.status(200).json({ success: true, message: "Status marked as viewed" });
  } catch (error) {
    console.error("Error viewing status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
