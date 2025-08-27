import { appAuthMiddleware } from "../middleware/authMiddleware.js";
import { AuthenticatedRequest } from "../types/authenticatedRequest.types.js";
import { Response, Router } from "express";
import { yahooService } from "../services/yahooAuth.service.js";

const router = Router();

// --- (E) Protected API: example players proxy (uses Clerk userId, not client-supplied) ---
router.get("/players", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { leagueKey, search, start = 0, count = 25 } = req.query as unknown as { 
      leagueKey: string; 
      search?: string; 
      start?: number; 
      count?: number; 
    };
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const players = await yahooService.getPlayers(userId, leagueKey, search, start, count);

    res.json(players);
  } catch (e: any) {
    console.error("Players fetch failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo players request failed" });
  }
});

// --- Diagnostics: "Who am I / what games do I have?" ---
router.get("/games", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  console.log("🔍 Getting user games for user:", req.userId);
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const games = await yahooService.getUserGames(req.userId);

    res.json(games);
  } catch (e: any) {
    console.error("Games fetch failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo games request failed" });
  }
});

// --- League settings ---
router.get("/league/settings", appAuthMiddleware(["user"]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leagueKey } = req.query as unknown as { leagueKey: string };
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const leagueSettings = await yahooService.getLeagueSettings(req.userId, leagueKey);

    res.json(leagueSettings);
  } catch (e: any) {
    console.error("League settings failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo league settings failed" });
  }
});

// --- League draft results (includes auction prices when applicable) ---
router.get("/league/draftresults", appAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leagueKey } = req.query as unknown as { leagueKey: string };
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    
    const draftResults = await yahooService.getLeagueDraftResults(req.userId, leagueKey);

    res.json(draftResults);
  } catch (e: any) {
    console.error("Draft results failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo draft results failed" });
  }
});

// --- League teams ---
router.get("/league/teams", appAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leagueKey } = req.query as { leagueKey: string };
    if (!leagueKey) return res.status(400).json({ error: "leagueKey required" });
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    
    const teams = await yahooService.getLeagueTeams(req.userId, leagueKey);

    res.json(teams);
  } catch (e: any) {
    console.error("League teams failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo league teams failed" });
  }
});

// --- Optional: team roster if you have a teamKey like "nfl.l.12345.t.7" ---
router.get("/team/roster", appAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { teamKey } = req.query as { teamKey: string };
    if (!teamKey) return res.status(400).json({ error: "teamKey required" });
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    
    const roster = await yahooService.getTeamRoster(req.userId, teamKey);

    res.json(roster);
  } catch (e: any) {
    console.error("Team roster failed:", e.response?.data || e.message);
    res.status(500).json({ error: "Yahoo team roster failed" });
  }
});

export default router;