import express from "express";
import { getCallHistory, createCallLog } from "../controllers/callHistory.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCallHistory);
router.post("/", createCallLog);

export default router;
