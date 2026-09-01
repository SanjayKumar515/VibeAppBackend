import express from "express";
import { createStatus, getStatuses, viewStatus } from "../controllers/status.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createStatus);
router.get("/", getStatuses);
router.post("/:statusId/view", viewStatus);

export default router;
