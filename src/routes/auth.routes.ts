import { Router } from "express";
import { requestOtp, verifyOtp, editProfile } from "../controllers/auth.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// FCM OTP Authentication
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

// Edit profile route, protected by authMiddleware
router.put("/profile", authMiddleware, editProfile);

export default router;