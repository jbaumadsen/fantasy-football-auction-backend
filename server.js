// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const axios = require('axios');
// require('dotenv').config();

import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";
import qs from "qs";
import mongoose from "mongoose";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import crypto from "crypto";
import UserToken from "./models/UserToken.js";

const {
  PORT = 4000,
  CORS_ORIGINS,
  MONGODB_URI,
  YAHOO_CLIENT_ID,
  YAHOO_CLIENT_SECRET,
  REDIRECT_URI,
  CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY,
} = process.env;

// Log environment variables (without secrets)
console.log("🔧 Environment check:");
console.log("  PORT:", PORT);
console.log("  CORS_ORIGINS:", CORS_ORIGINS);
console.log("  MONGODB_URI:", MONGODB_URI ? "✅ Set" : "❌ Missing");
console.log("  YAHOO_CLIENT_ID:", YAHOO_CLIENT_ID ? "✅ Set" : "❌ Missing");
console.log("  YAHOO_CLIENT_SECRET:", YAHOO_CLIENT_SECRET ? "✅ Set" : "❌ Missing");
console.log("  REDIRECT_URI:", REDIRECT_URI);
console.log("  CLERK_SECRET_KEY:", CLERK_SECRET_KEY ? "✅ Set" : "❌ Missing");
console.log("  CLERK_PUBLISHABLE_KEY:", CLERK_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing");
  
const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const YAHOO_TOKEN_URL = `https://api.login.yahoo.com/oauth2/get_token`;
const YAHOO_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";

const app = express();

// Clerk middleware
app.use(clerkMiddleware({
  publishableKey: CLERK_PUBLISHABLE_KEY,
  secretKey: CLERK_SECRET_KEY,
}));

// Middleware
app.use(express.json());

const allowedOrigins = CORS_ORIGINS
  ? CORS_ORIGINS.split(',')
  : [];

console.log("allowedOrigins: ", allowedOrigins);

// Define a CORS function to dynamically check allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (e.g. server-to-server request), or origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(cors(corsOptions));

// configure cors
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// MongoDB connection
mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const basicAuth = () =>
  "Basic " + Buffer.from(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`).toString("base64");

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
  if (sig !== expected) return null;
  return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
}

// --- (B) Start Yahoo OAuth (user must be signed in) ---
app.get("/auth/yahoo/url", requireAuth(), (req, res) => {
  console.log("🚀 Starting Yahoo OAuth flow...");
  const userId = req.auth.userId;           // ← Clerk user id
  console.log("👤 Clerk userId:", userId);
  
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = signState({ userId, nonce, ts: Date.now() });
  console.log("🔐 Generated state:", state);

  const url = new URL(YAHOO_AUTH_URL);
  url.searchParams.set("client_id", YAHOO_CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "fspt-r");  // read-only
  url.searchParams.set("state", state);

  console.log("🔗 Redirecting to Yahoo OAuth URL:", url.toString());
  res.json({ url: url.toString() });
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
    
    const tokenRes = await axios.post(
      YAHOO_TOKEN_URL,
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuth(),
        },
      }
    );

    console.log("✅ Token exchange successful");
    console.log("📊 Token response:", {
      expires_in: tokenRes.data.expires_in,
      has_access_token: !!tokenRes.data.access_token,
      has_refresh_token: !!tokenRes.data.refresh_token
    });

    const expires_at = new Date(Date.now() + tokenRes.data.expires_in * 1000);

    console.log("💾 Saving tokens to database...");
    await UserToken.findOneAndUpdate(
      { localUserId: parsed.userId }, // Clerk user id
      {
        access_token: tokenRes.data.access_token,
        refresh_token: tokenRes.data.refresh_token,
        expires_at,
      },
      { upsert: true, new: true }
    );
    console.log("✅ Tokens saved to database");

    console.log("🔄 Redirecting to frontend...");
    res.redirect(`${REDIRECT_URI}/?connected=yahoo`);
  } catch (e) {
    console.error("❌ Token exchange failed:", e.response?.data || e.message);
    console.error("🔍 Full error:", e);
    res.status(500).send("Token exchange failed");
  }
});

// --- (D) Helper: refresh if needed ---
async function getOrRefreshAccessToken(userId) {
  const rec = await UserToken.findOne({ localUserId: userId });
  if (!rec) throw new Error("No Yahoo tokens for user");
  if (Date.now() > rec.expires_at.getTime() - 60_000) {
    const resp = await axios.post(
      YAHOO_TOKEN_URL,
      qs.stringify({
        grant_type: "refresh_token",
        refresh_token: rec.refresh_token,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: basicAuth(),
        },
      }
    );
    rec.access_token = resp.data.access_token;
    rec.expires_at = new Date(Date.now() + resp.data.expires_in * 1000);
    if (resp.data.refresh_token) rec.refresh_token = resp.data.refresh_token;
    await rec.save();
  }
  return rec.access_token;
}

// --- (E) Protected API: example players proxy (uses Clerk userId, not client-supplied) ---
app.get("/api/yahoo/players", requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { leagueKey, search, start = 0, count = 25 } = req.query;
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });

    const token = await getOrRefreshAccessToken(userId);

    let path = `/league/${leagueKey}/players;start=${start};count=${count}`;
    if (search) path += `;search=${encodeURIComponent(String(search))}`;
    const url = `${YAHOO_API_URL}${path}?format=json`;

    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("Players fetch failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo players request failed" });
  }
});

// --- Diagnostics: "Who am I / what games do I have?" ---
app.get("/api/yahoo/games", requireAuth(), async (req, res) => {
  try {
    const token = await getOrRefreshAccessToken(req.auth.userId);
    // Lists games for the logged-in Yahoo user (NFL, MLB, etc.)
    const url = `${YAHOO_API_URL}/users;use_login=1/games?format=json`;
    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("Games fetch failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo games request failed" });
  }
});

// --- League settings ---
app.get("/api/yahoo/league/settings", requireAuth(), async (req, res) => {
  try {
    const { leagueKey } = req.query;
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    const token = await getOrRefreshAccessToken(req.auth.userId);

    const url = `${YAHOO_API_URL}/league/${leagueKey}/settings?format=json`;
    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("League settings failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo league settings failed" });
  }
});

// --- League draft results (includes auction prices when applicable) ---
app.get("/api/yahoo/league/draftresults", requireAuth(), async (req, res) => {
  try {
    const { leagueKey } = req.query;
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    const token = await getOrRefreshAccessToken(req.auth.userId);

    const url = `${YAHOO_API_URL}/league/${leagueKey}/draftresults?format=json`;
    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("Draft results failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo draft results failed" });
  }
});

// --- League teams ---
app.get("/api/yahoo/league/teams", requireAuth(), async (req, res) => {
  try {
    const { leagueKey } = req.query;
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    const token = await getOrRefreshAccessToken(req.auth.userId);

    const url = `${YAHOO_API_URL}/league/${leagueKey}/teams?format=json`;
    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("League teams failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo league teams failed" });
  }
});

// --- Optional: team roster if you have a teamKey like "nfl.l.12345.t.7" ---
app.get("/api/yahoo/team/roster", requireAuth(), async (req, res) => {
  try {
    const { teamKey } = req.query;
    if (!teamKey) return res.status(400).json({ error: "teamKey required" });
    const token = await getOrRefreshAccessToken(req.auth.userId);

    const url = `${YAHOO_API_URL}/team/${teamKey}/roster?format=json`;
    const yRes = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(yRes.data);
  } catch (e) {
    console.error("Team roster failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo team roster failed" });
  }
});


app.listen(PORT, () => console.log(`🚀 Backend on http://localhost:${PORT}`));