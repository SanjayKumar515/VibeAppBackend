import { UserProps } from "../types";
import jwt from "jsonwebtoken";

export const generateToken = (user: any) => {
    const userId = (user.id || user._id)?.toString();
    // Keep JWT payload lightweight (<1KB) so HTTP Authorization header never exceeds server 8KB/16KB limits
    const avatarForToken = (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http'))
        ? user.avatar
        : '';

    const payload = {
        user: {
            id: userId,
            name: user.name || '',
            phoneNumber: user.phoneNumber,
            avatar: avatarForToken,
            about: user.about || "Hey there! I am using Vibe App.",
        }
    };
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '30d'
    });
};