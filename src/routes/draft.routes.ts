// src/routes/draft.routes.ts
import express from "express";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/authenticatedRequest.types.js";
import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import yahooApiService from "../services/yahooApi.service.js";
import { draftService } from "../services/draft.service.js";
import { extractPicks, extractTeams, extractBudget, computeBudgets } from "../utils/yahooDataTransformers.js";


const router = express.Router();

type CacheEntry = {
  data: any;
  updatedAt: number;
  inflight?: Promise<any>;
};
const cache = new Map<string, CacheEntry>();

const SNAPSHOT_TTL_MS = 1500; // serve same snapshot to everyone for 1.5s

// Yahoo data transformation utilities are now imported from ../utils/yahooDataTransformers.js

// Existing snapshot endpoint
router.get("/snapshot", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const leagueKey = String(req.query.leagueKey || "");
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });

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
    } catch (e: any) {
      return res.status(500).json({ error: "Snapshot fetch failed" });
    }
  }

  const entry: CacheEntry = hit || { data: null, updatedAt: 0 };
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
    // console.log(`📊 Draft snapshot for ${leagueKey}:`, {
    //   teamsFound: teams.length,
    //   picksFound: picks.length,
    //   budgetCap: budget
    // });

    const budgets = computeBudgets(teams, picks, budget);

    // console.log(`📊 Draft snapshot for ${leagueKey}:`, {
    //   teamsFound: teams.length,
    //   picksFound: picks.length,
    //   budgetCap: budget,
    //   teamKeys: teams.map(t => t.team_key)
    // });

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
  } catch (e: any) {
    entry.inflight = undefined;
    res.status(500).json({ error: "Snapshot fetch failed" });
  }
});



// Bulk fetch and store all player analyses for a league
router.post("/bulk-fetch-player-analyses", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { leagueKey, batchSize = 50 } = req.body;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!leagueKey) return res.status(400).json({ error: "leagueKey is required in request body" });

  try {
    console.log(`🔄 Starting bulk fetch of player analyses for league: ${leagueKey}`);
    
    const result = await draftService.getAndUpdatePlayerDraftAnalysisFromYahoo(userId, leagueKey);

    console.log(`✅ Bulk fetch of player analyses for league: ${leagueKey} completed`);
    
    res.json({
      success: true,
      leagueKey,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error("❌ Error in bulk fetch of player analyses:", error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      leagueKey 
    });
  }
});

// // Get count of stored player analyses for a league
// router.get("/player-analyses/:leagueKey/count", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
//   const { leagueKey } = req.params;
  
//   if (!leagueKey) return res.status(400).json({ error: "leagueKey parameter is required" });

//   try {
//     console.log(`📊 Counting player analyses for league: ${leagueKey}`);
    
//     const count = await draftService.getPlayerAnalysesCount(leagueKey);
    
//     res.json({
//       success: true,
//       leagueKey,
//       timestamp: new Date().toISOString(),
//       count
//     });
//   } catch (error) {
//     console.error("❌ Error counting player analyses:", error);
//     res.status(500).json({ 
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error",
//       leagueKey 
//     });
//   }
// });

// Simple test endpoint for Yahoo draft analysis API
router.get("/test-draft-analysis", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { leagueKey } = req.query;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!leagueKey) return res.status(400).json({ error: "leagueKey query parameter required" });

  try {
    console.log(`🧪 Testing draft analysis for league: ${leagueKey}`);
    
    // Call Yahoo API directly with draft_analysis
    const result = await yahooApiService.getPlayersWithDraftAnalysis(userId, leagueKey as string, { count: 50 });

    const stringifiedResult = JSON.stringify(result);

    console.log("result", stringifiedResult);
    
    res.json({
      success: true,
      leagueKey,
      timestamp: new Date().toISOString(),
      rawData: result
    });
  } catch (error) {
    console.error("❌ Error testing draft analysis:", error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      leagueKey 
    });
  }
});

export default router;
