import { appAuthMiddleware } from "../middleware/authMiddleware";
import express from "express";
import { getYahooAuthUrl } from "../controllers/auth.controller";
const router = express.Router();
// --- (B) Start Yahoo OAuth (user must be signed in) ---
router.get("/yahoo/url", appAuthMiddleware(["user"]), getYahooAuthUrl);
export default router;
//# sourceMappingURL=auth.routes.js.map