import { Router } from "express";
import { verifyPhoneAuth } from "../controllers/auth.controllers";

const router = Router();

// Replace separate login and register with a single verify endpoint
router.post("/verify", verifyPhoneAuth);

export default router;