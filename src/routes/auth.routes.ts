import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import { AuthenticatedRequest } from "../types/authenticatedRequest.types.js";
import { Response } from "express";
import crypto from "crypto";
import { YahooService } from "../services/yahoo.service.js";
import { YAHOO_AUTH_URL, YAHOO_CLIENT_ID, REDIRECT_URI } from "../config/yahoo.config.js";
import express from "express";

const router = express.Router();
const yahooService = new YahooService();
const signState = yahooService.signState;


// --- (B) Start Yahoo OAuth (user must be signed in) ---
router.get("/yahoo/url", appAuthMiddleware(["user"]), (req: AuthenticatedRequest, res: Response) => {
  console.log("🚀 Starting Yahoo OAuth flow...");
  const userId = req.userId;
  console.log("👤 Clerk userId:", userId);
  
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = signState({ userId, nonce, ts: Date.now() });
  console.log("🔐 Generated state:", state);

  const url = new URL(YAHOO_AUTH_URL);
  url.searchParams.set("client_id", YAHOO_CLIENT_ID!);
  url.searchParams.set("redirect_uri", REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "fspt-w");  // read-only
  url.searchParams.set("state", state);

  console.log("🔗 Redirecting to Yahoo OAuth URL:", url.toString());
  res.json({ url: url.toString() });
});

export default router;