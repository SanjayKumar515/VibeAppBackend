import { UserProps } from "../types";
import jwt from "jsonwebtoken";

export const generateToken = (user: any) => {
    const userId = (user.id || user._id)?.toString();
    const payload = {
        user: {
            id: userId,
            name: user.name,
            phoneNumber: user.phoneNumber,
            avatar: user.avatar,
            about: user.about,
        }
    };
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '30d'
    });
};