import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import express from "express";

import { deleteYahooAuth, getYahooAuthUrl, getYahooCallback } from "../controllers/auth.controller.js";

const router = express.Router();


// --- (B) Start Yahoo OAuth (user must be signed in) ---
router.get("/yahoo/url", appAuthMiddleware(["user"]), getYahooAuthUrl);

router.get("/yahoo/callback", getYahooCallback);

router.delete("/yahoo/disconnect", appAuthMiddleware(["user"]), deleteYahooAuth);


export default router;