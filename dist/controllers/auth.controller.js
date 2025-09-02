import { REDIRECT_URI, YAHOO_CLIENT_ID, YAHOO_AUTH_URL, } from "../config/yahoo.config.js";
import crypto from "crypto";
import { YahooAuthService } from "../services/yahooAuth.service.js";
import { AppError } from "../types/error.types.js";
import UserToken from "../models/UserToken.js";
const yahooAuthService = new YahooAuthService();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
export const getYahooAuthUrl = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            throw new AppError("Unauthorized: User ID is required", 401);
        }
        const nonce = crypto.randomBytes(16).toString("hex");
        const state = yahooAuthService.signState({ userId, nonce, ts: Date.now() });
        const url = new URL(YAHOO_AUTH_URL);
        url.searchParams.set("client_id", YAHOO_CLIENT_ID);
        url.searchParams.set("redirect_uri", REDIRECT_URI);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", process.env.YAHOO_SCOPE || "fspt-w"); // read/write
        url.searchParams.set("state", state);
        console.log("----- getYahooAuthUrl -----");
        console.log("🔗 Redirecting to Yahoo OAuth URL: ", url.toString());
        console.log("🔐 State:", state);
        console.log("Redirect URI: ", REDIRECT_URI);
        res.json({ url: url.toString() });
    }
    catch (e) {
        next(e);
    }
};
export const getYahooCallback = async (req, res, next) => {
    try {
        console.log("📥 OAuth callback:", req.originalUrl);
        // 1) Yahoo error passthrough
        const { error, error_description } = req.query;
        if (error) {
            return res.redirect(`${FRONTEND_ORIGIN}/oauth-error?provider=yahoo&error=${encodeURIComponent(error)}&desc=${encodeURIComponent(error_description || "")}`);
        }
        // 2) Validate inputs
        const code = req.query.code;
        const state = req.query.state;
        if (!code || !state) {
            // If the browser somehow hit the callback with only ?connected=yahoo, bounce to UI
            if (req.query.connected === "yahoo") {
                return res.redirect(`${FRONTEND_ORIGIN}/?connected=yahoo`);
            }
            return res
                .status(400)
                .send("Invalid OAuth callback. Please restart the sign-in flow.");
        }
        // 3) Delegate to service
        try {
            const { userId } = await yahooAuthService.handleOAuthCallback(code, state);
            console.log("✅ Tokens saved for user:", userId);
            // 4) Redirect to the frontend (NOT to REDIRECT_URI)
            const dest = `${FRONTEND_ORIGIN}/?connected=yahoo`;
            console.log("🔄 Redirecting to:", dest);
            return res.redirect(dest);
        }
        catch (e) {
            next(e);
        }
    }
    catch (e) {
        next(e);
    }
};
export const deleteYahooAuth = async (req, res, next) => {
    try {
        const userId = req.userId;
        await UserToken.findOneAndDelete({ localUserId: userId });
        res.sendStatus(204);
    }
    catch (e) {
        next(e);
    }
};
//# sourceMappingURL=auth.controller.js.map