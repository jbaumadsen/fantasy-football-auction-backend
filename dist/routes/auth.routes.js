import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import express from "express";
import { getYahooAuthUrl } from "../controllers/auth.controller.js";
const router = express.Router();
// --- (B) Start Yahoo OAuth (user must be signed in) ---
router.get("/yahoo/url", appAuthMiddleware(["user"]), getYahooAuthUrl);
export default router;
//# sourceMappingURL=auth.routes.js.map