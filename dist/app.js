import express from "express";
import cors from "cors";
import axios from "axios";
import qs from "qs";
import { clerkMiddleware } from "@clerk/express";
import crypto from "crypto";
import UserToken from "./models/UserToken.js";
import corsOptions from "./config/cors.config.js";
import connectDB from "./config/db.config.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { yahooService } from "./services/yahoo.service.js";
import { appAuthMiddleware } from "./middleware/authMiddleware.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";
import authRoutes from "./routes/auth.routes.js";
const { MONGODB_URI, YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, REDIRECT_URI, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, } = process.env;
const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = `https://api.login.yahoo.com/oauth2/get_token`;
const app = express();
// GlobalMiddleware
app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(clerkMiddleware({
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
}));
// MongoDB connection
connectDB(MONGODB_URI);
const basicAuth = () => "Basic " + Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString("base64");
// --- (A) STATE signing for OAuth callback security ---
function signState(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto
        .createHmac("sha256", CLERK_SECRET_KEY)
        .update(data)
        .digest("base64url");
    return `${data}.${sig}`;
}
function verifyState(state) {
    const [data, sig] = String(state).split(".");
    const expected = crypto
        .createHmac("sha256", CLERK_SECRET_KEY)
        .update(data)
        .digest("base64url");
    if (sig !== expected)
        return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
}
app.delete("/auth/yahoo/disconnect", appAuthMiddleware(["user"]), async (req, res) => {
    const userId = req.userId;
    await UserToken.findOneAndDelete({ localUserId: userId });
    res.sendStatus(204);
});
// --- (C) OAuth callback: exchange code and store tokens under Clerk userId ---
app.get("/auth/yahoo/callback", async (req, res) => {
    console.log("📥 OAuth callback received");
    console.log("📋 Query params:", req.query);
    const { code, state } = req.query;
    if (!code || !state) {
        console.log("❌ Missing code or state");
        return res.status(400).send("Missing code/state");
    }
    console.log("🔐 Verifying state...");
    const parsed = verifyState(state);
    if (!parsed?.userId) {
        console.log("❌ Bad state verification");
        return res.status(400).send("Bad state");
    }
    console.log("✅ State verified for userId:", parsed.userId);
    try {
        console.log("🔄 Exchanging code for tokens...");
        console.log("📤 Token request body:", {
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        });
        const tokenRes = await axios.post(YAHOO_TOKEN_URL, qs.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: basicAuth(),
            },
        });
        console.log("✅ Token exchange successful");
        console.log("📊 Token response:", {
            expires_in: tokenRes.data.expires_in,
            has_access_token: !!tokenRes.data.access_token,
            has_refresh_token: !!tokenRes.data.refresh_token
        });
        const expires_at = new Date(Date.now() + tokenRes.data.expires_in * 1000);
        console.log("💾 Saving tokens to database...");
        await UserToken.findOneAndUpdate({ localUserId: parsed.userId }, // Clerk user id
        {
            access_token: tokenRes.data.access_token,
            refresh_token: tokenRes.data.refresh_token,
            expires_at,
        }, { upsert: true, new: true });
        console.log("✅ Tokens saved to database");
        console.log("🔄 Redirecting to frontend...");
        res.redirect(`${REDIRECT_URI}/?connected=yahoo`);
    }
    catch (e) {
        console.error("❌ Token exchange failed:", e.response?.data || e.message);
        console.error("🔍 Full error:", e);
        res.status(500).send("Token exchange failed");
    }
});
app.use("/auth", authRoutes);
// // --- (D) Helper: refresh if needed ---
// async function getOrRefreshAccessToken(userId: string) {
//   const rec = await UserToken.findOne({ localUserId: userId });
//   if (!rec) throw new Error("No Yahoo tokens for user");
//   if (Date.now() > (rec.expires_at as Date).getTime() - 60_000) {
//     const resp = await axios.post(
//       YAHOO_TOKEN_URL,
//       qs.stringify({
//         grant_type: "refresh_token",
//         refresh_token: rec.refresh_token,
//         redirect_uri: REDIRECT_URI,
//       }),
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           Authorization: basicAuth(),
//         },
//       }
//     );
//     rec.access_token = resp.data.access_token;
//     rec.expires_at = new Date(Date.now() + resp.data.expires_in * 1000);
//     if (resp.data.refresh_token) rec.refresh_token = resp.data.refresh_token;
//     await rec.save();
//   }
//   return rec.access_token;
// }
// --- (E) Protected API: example players proxy (uses Clerk userId, not client-supplied) ---
app.get("/api/yahoo/players", appAuthMiddleware(["user"]), async (req, res) => {
    try {
        const userId = req.userId;
        const { leagueKey, search, start = 0, count = 25 } = req.query;
        if (!leagueKey)
            return res.status(400).json({ error: "leagueKey required" });
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const players = await yahooService.getPlayers(userId, leagueKey, search, start, count);
        res.json(players);
    }
    catch (e) {
        console.error("Players fetch failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo players request failed" });
    }
});
// --- Diagnostics: "Who am I / what games do I have?" ---
app.get("/api/yahoo/games", appAuthMiddleware(["user"]), async (req, res) => {
    console.log("🔍 Getting user games for user:", req.userId);
    try {
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const games = await yahooService.getUserGames(req.userId);
        res.json(games);
    }
    catch (e) {
        console.error("Games fetch failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo games request failed" });
    }
});
// --- League settings ---
app.get("/api/yahoo/league/settings", appAuthMiddleware(["user"]), async (req, res) => {
    try {
        const { leagueKey } = req.query;
        if (!leagueKey)
            return res.status(400).json({ error: "leagueKey required" });
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const leagueSettings = await yahooService.getLeagueSettings(req.userId, leagueKey);
        res.json(leagueSettings);
    }
    catch (e) {
        console.error("League settings failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo league settings failed" });
    }
});
// --- League draft results (includes auction prices when applicable) ---
app.get("/api/yahoo/league/draftresults", appAuthMiddleware, async (req, res) => {
    try {
        const { leagueKey } = req.query;
        if (!leagueKey)
            return res.status(400).json({ error: "leagueKey required" });
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const draftResults = await yahooService.getLeagueDraftResults(req.userId, leagueKey);
        res.json(draftResults);
    }
    catch (e) {
        console.error("Draft results failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo draft results failed" });
    }
});
// --- League teams ---
app.get("/api/yahoo/league/teams", appAuthMiddleware, async (req, res) => {
    try {
        const { leagueKey } = req.query;
        if (!leagueKey)
            return res.status(400).json({ error: "leagueKey required" });
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const teams = await yahooService.getLeagueTeams(req.userId, leagueKey);
        res.json(teams);
    }
    catch (e) {
        console.error("League teams failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo league teams failed" });
    }
});
// --- Optional: team roster if you have a teamKey like "nfl.l.12345.t.7" ---
app.get("/api/yahoo/team/roster", appAuthMiddleware, async (req, res) => {
    try {
        const { teamKey } = req.query;
        if (!teamKey)
            return res.status(400).json({ error: "teamKey required" });
        if (!req.userId)
            return res.status(401).json({ error: "Unauthorized" });
        const roster = await yahooService.getTeamRoster(req.userId, teamKey);
        res.json(roster);
    }
    catch (e) {
        console.error("Team roster failed:", e.response?.data || e.message);
        res.status(500).json({ error: "Yahoo team roster failed" });
    }
});
// Error handling
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map