import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/modals/User";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Database Connected");
        
        let user = new User({
            phoneNumber: "+918888888888",
            fcmToken: "dummy_token",
            otp: "123456",
            otpExpiresAt: new Date(),
            name: "New User",
            avatar: "",
            about: "Hey there! I am using WhatsApp.",
        });
        await user.save();
        console.log("User saved successfully");
    } catch (error) {
        console.error("Error connecting or saving user:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

run();
