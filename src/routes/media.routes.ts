import { Router } from "express";
import { uploadMedia, getMedia } from "../controllers/media.controllers";

const router = Router();

// Universal Media Upload endpoint
router.post("/upload", uploadMedia);

// Universal Media Access endpoint: accessible in any browser or app
router.get("/:id", getMedia);

export default router;

