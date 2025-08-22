import { REDIRECT_URI, YAHOO_CLIENT_ID, YAHOO_AUTH_URL } from "../config/yahoo.config.js";
import crypto from "crypto";
import { YahooService } from "../services/yahoo.service.js";
import { AppError } from "../types/error.types.js";
const yahooService = new YahooService();
export const getYahooAuthUrl = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        throw new AppError("Unauthorized: User ID is required", 401);
    }
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = yahooService.signState({ userId, nonce, ts: Date.now() });
    const url = new URL(YAHOO_AUTH_URL);
    url.searchParams.set("client_id", YAHOO_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "fspt-w"); // read-only
    url.searchParams.set("state", state);
    console.log("----- getYahooAuthUrl -----");
    console.log("🔗 Redirecting to Yahoo OAuth URL: ", url.toString());
    console.log("🔐 State:", state);
    console.log("Redirect URI: ", REDIRECT_URI);
    res.json({ url: url.toString() });
};
//# sourceMappingURL=auth.controller.js.map