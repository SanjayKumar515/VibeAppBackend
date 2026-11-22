import { Router } from "express";
import { requestOtp, verifyOtp, getProfile, editProfile } from "../controllers/auth.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// FCM OTP Authentication
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

// Profile routes, protected by authMiddleware
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, editProfile);

export default router;