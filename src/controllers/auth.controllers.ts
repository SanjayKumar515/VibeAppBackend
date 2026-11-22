import { Request, Response } from "express"
import User from "../modals/User";
import { generateToken } from "../utils/token";
import { getMessaging } from "firebase-admin/messaging";

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
    const { phoneNumber, fcmToken } = req.body || {};

    if (!phoneNumber || !fcmToken) {
        res.status(400).json({ success: false, msg: "phoneNumber and fcmToken are required" });
        return;
    }

    try {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

        // Find or create user
        let user = await User.findOne({ phoneNumber });
        if (user) {
            user.otp = otp;
            user.otpExpiresAt = otpExpiresAt;
            user.fcmToken = fcmToken;
            await user.save();
        } else {
            user = new User({
                phoneNumber,
                fcmToken,
                otp,
                otpExpiresAt,
                name: "New User",
                avatar: "",
                about: "Hey there! I am using WhatsApp.",
            });
            await user.save();
        }

        // Send OTP via FCM Push Notification
        const message = {
            notification: {
                title: "Your VibeApp Verification Code",
                body: `Your OTP is ${otp}. It will expire in 10 minutes.`
            },
            token: fcmToken
        };

        console.log(`\n========================================`);
        console.log(`🔑 OTP GENERATED FOR ${phoneNumber}: ${otp}`);
        console.log(`========================================\n`);

        try {
            await getMessaging().send(message);
            res.json({ success: true, msg: "OTP sent successfully via push notification" });
        } catch (fcmError) {
            console.log("FCM send failed (this is normal if using dummy token):", fcmError);
            res.json({ success: true, msg: "OTP generated (push notification skipped)" });
        }
    } catch (error) {
        console.log("OTP request error", error);
        res.status(500).json({ success: false, msg: "Failed to generate OTP" });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { phoneNumber, otp } = req.body || {};

    if (!phoneNumber || !otp) {
        res.status(400).json({ success: false, msg: "phoneNumber and otp are required" });
        return;
    }

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            res.status(404).json({ success: false, msg: "User not found" });
            return;
        }

        if (user.otp !== otp) {
            res.status(400).json({ success: false, msg: "Invalid OTP" });
            return;
        }

        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            res.status(400).json({ success: false, msg: "OTP has expired" });
            return;
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        // Generate backend JWT token
        const backendToken = generateToken(user);

        res.json({
            success: true,
            token: backendToken
        });

    } catch (error) {
        console.log("OTP verification error", error);
        res.status(500).json({ success: false, msg: "Server error during verification" });
    }
}

export const getProfile = async (req: any, res: Response): Promise<void> => {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
        res.status(401).json({ success: false, msg: "Unauthorized" });
        return;
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({ success: false, msg: "User not found" });
            return;
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                avatar: user.avatar || "",
                about: user.about || "Hey there! I am using Vibe App.",
            }
        });
    } catch (error) {
        console.log("Get profile error", error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

export const editProfile = async (req: any, res: Response): Promise<void> => {
    // using any for req to avoid import conflicts, or we can use the AuthRequest
    const userId = req.user?.id || req.user?._id;
    const { name, avatar, about } = req.body;

    if (!userId) {
        res.status(401).json({ success: false, msg: "Unauthorized" });
        return;
    }

    try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = typeof name === 'string' ? name.trim() : name;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (about !== undefined) updateData.about = typeof about === 'string' ? about.trim() : about;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ success: false, msg: "User not found" });
            return;
        }

        // Generate fresh token for updated profile
        const newToken = generateToken(updatedUser);

        res.json({
            success: true,
            msg: "Profile updated successfully",
            token: newToken,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                phoneNumber: updatedUser.phoneNumber,
                avatar: updatedUser.avatar,
                about: updatedUser.about,
            }
        });
    } catch (error) {
        console.log("Edit profile error", error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};