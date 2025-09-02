// src/routes/draft.routes.ts
import express from "express";
import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import yahooApiService from "../services/yahooApi.service.js";
const router = express.Router();
const cache = new Map();
const SNAPSHOT_TTL_MS = 1500; // serve same snapshot to everyone for 1.5s
// Helpers: improved Yahoo JSON parsing
// pull the first value for a given key from Yahoo's "array-of-objects" node
function firstVal(arr, key) {
    if (!Array.isArray(arr))
        return undefined;
    for (const item of arr) {
        if (item && Object.prototype.hasOwnProperty.call(item, key)) {
            return item[key];
        }
    }
    return undefined;
}
function extractPicks(draftJson, leagueKey) {
    const dr = draftJson?.fantasy_content?.league?.[1]?.draft_results;
    if (!dr || typeof dr !== 'object')
        return [];
    // gameKey helps if Yahoo returns player_id but not player_key
    const gameKey = (leagueKey || "").split(".l.")[0]; // e.g. "nfl" or "388"
    const out = [];
    // Yahoo uses numbered keys: { "0": { draft_result: {...} }, "1": { draft_result: {...} } }
    for (const key of Object.keys(dr)) {
        if (key === 'count')
            continue; // Skip count property
        const entry = dr[key];
        if (!entry?.draft_result)
            continue;
        const r = entry.draft_result;
        const player_key = r.player_key;
        const team_key = r.team_key;
        const cost = r.cost ? Number(r.cost) : undefined;
        if (player_key && team_key) {
            out.push({ player_key, team_key, cost });
        }
    }
    return out;
}
function extractTeams(teamsJson) {
    const teamsNode = teamsJson?.fantasy_content?.league?.[1]?.teams;
    if (!teamsNode || typeof teamsNode !== 'object')
        return [];
    const out = [];
    // Yahoo stores teams as numbered keys: { '0': { team: [...] }, '1': { team: [...] }, count: 10 }
    for (const key of Object.keys(teamsNode)) {
        // Skip the 'count' property
        if (key === 'count')
            continue;
        const entry = teamsNode[key];
        if (!entry?.team)
            continue;
        // Each team is wrapped in an extra array: team: [ [ {...}, {...}, {...} ] ]
        const teamData = entry.team[0]; // Get the first (and only) array element
        if (!teamData || !Array.isArray(teamData))
            continue;
        // Find team_key and name in the array of objects
        let team_key = "";
        let name = "";
        for (const item of teamData) {
            if (item.team_key)
                team_key = item.team_key;
            if (item.name)
                name = item.name;
        }
        if (team_key)
            out.push({ team_key, name });
    }
    return out;
}
function extractBudget(settingsJson) {
    // Draft budget can live under different paths depending on sport/season.
    // Try a couple of common ones, fall back to 200.
    const leagueNode = settingsJson?.fantasy_content?.league?.[1];
    return Number(leagueNode?.settings?.[0]?.league?.[0]?.draft_budget ??
        leagueNode?.settings?.[0]?.draft_budget ??
        200);
}
function computeBudgets(teams, picks, leagueBudget) {
    const spent = new Map();
    for (const p of picks) {
        const cost = Number(p.cost || 0);
        if (cost > 0)
            spent.set(p.team_key, (spent.get(p.team_key) || 0) + cost);
    }
    return teams.map(t => {
        const used = spent.get(t.team_key) || 0;
        const remaining = Math.max(leagueBudget - used, 0);
        return { team_key: t.team_key, team_name: t.name, spent: used, remaining, maxBid: Math.max(remaining - 1, remaining) };
    }).sort((a, b) => b.remaining - a.remaining);
}
// Existing snapshot endpoint
router.get("/snapshot", appAuthMiddleware(["user"]), async (req, res) => {
    const userId = req.userId;
    const leagueKey = String(req.query.leagueKey || "");
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    if (!leagueKey)
        return res.status(400).json({ error: "leagueKey required" });
    console.log("leagueKey", leagueKey);
    const now = Date.now();
    const key = leagueKey;
    // Serve fresh-enough cache
    const hit = cache.get(key);
    if (hit && now - hit.updatedAt < SNAPSHOT_TTL_MS && hit.data) {
        return res.json(hit.data);
    }
    // Share a single in-flight fetch among callers
    if (hit?.inflight) {
        try {
            const data = await hit.inflight;
            return res.json(data);
        }
        catch (e) {
            return res.status(500).json({ error: "Snapshot fetch failed" });
        }
    }
    const entry = hit || { data: null, updatedAt: 0 };
    cache.set(key, entry);
    entry.inflight = (async () => {
        const [draftJson, teamsJson, settingsJson] = await Promise.all([
            yahooApiService.getLeagueDraftResults(userId, leagueKey),
            yahooApiService.getLeagueTeams(userId, leagueKey),
            yahooApiService.getLeagueSettings(userId, leagueKey),
        ]);
        // Extract data
        const picks = extractPicks(draftJson, leagueKey);
        const teams = extractTeams(teamsJson);
        const budget = extractBudget(settingsJson);
        // Log summary for debugging
        console.log(`📊 Draft snapshot for ${leagueKey}:`, {
            teamsFound: teams.length,
            picksFound: picks.length,
            budgetCap: budget
        });
        const budgets = computeBudgets(teams, picks, budget);
        console.log(`📊 Draft snapshot for ${leagueKey}:`, {
            teamsFound: teams.length,
            picksFound: picks.length,
            budgetCap: budget,
            teamKeys: teams.map(t => t.team_key)
        });
        const payload = {
            leagueKey,
            budget,
            picks,
            budgets,
            lastUpdated: new Date().toISOString(),
            pickCount: picks.length,
        };
        entry.data = payload;
        entry.updatedAt = Date.now();
        entry.inflight = undefined;
        return payload;
    })();
    try {
        const data = await entry.inflight;
        res.json(data);
    }
    catch (e) {
        entry.inflight = undefined;
        res.status(500).json({ error: "Snapshot fetch failed" });
    }
});
// Simple test endpoint for Yahoo draft analysis API
router.get("/test-draft-analysis", appAuthMiddleware(["user"]), async (req, res) => {
    const userId = req.userId;
    const { leagueKey } = req.query;
    if (!userId)
        return res.status(401).json({ error: "Unauthorized" });
    if (!leagueKey)
        return res.status(400).json({ error: "leagueKey query parameter required" });
    try {
        console.log(`🧪 Testing draft analysis for league: ${leagueKey}`);
        // Call Yahoo API directly with draft_analysis
        const result = await yahooApiService.getPlayersWithDraftAnalysis(userId, leagueKey, { count: 50 });
        res.json({
            success: true,
            leagueKey,
            timestamp: new Date().toISOString(),
            rawData: result
        });
    }
    catch (error) {
        console.error("❌ Error testing draft analysis:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            leagueKey
        });
    }
});
export default router;
//# sourceMappingURL=draft.routes.js.map