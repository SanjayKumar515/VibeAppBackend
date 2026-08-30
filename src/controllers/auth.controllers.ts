import { Request, Response } from "express"
import User from "../modals/User";
import { generateToken } from "../utils/token";
import { getAuth } from "firebase-admin/auth";

export const verifyPhoneAuth = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    if (!token) {
        res.status(400).json({ success: false, msg: "Firebase token is required" });
        return;
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await getAuth().verifyIdToken(token);
        const firebaseUid = decodedToken.uid;
        const phoneNumber = decodedToken.phone_number;

        if (!phoneNumber) {
            res.status(400).json({ success: false, msg: "Phone number not found in token" });
            return;
        }

        // Check if user exists
        let user = await User.findOne({ firebaseUid });

        if (!user) {
            // Check if user exists by phone number (in case firebaseUid changed but phone is same)
            user = await User.findOne({ phoneNumber });
            
            if (user) {
                // Update existing user with new firebaseUid
                user.firebaseUid = firebaseUid;
                await user.save();
            } else {
                // Create new user
                user = new User({
                    phoneNumber,
                    firebaseUid,
                    name: "New User", // Default name, they can change it later
                    avatar: "",
                });
                await user.save();
            }
        }

        // Generate backend JWT token
        const backendToken = generateToken(user);

        res.json({
            success: true,
            token: backendToken
        });

    } catch (error) {
        console.log('Firebase verification error', error);
        res.status(401).json({ success: false, msg: "Invalid Firebase token" });
    }
}