// src/services/yahoo-api.service.ts
import axios from "axios";
import { AppError } from "../types/error.types.js";
import { YAHOO_API_URL, YAHOO_API_FORMAT } from "../config/yahoo.config.js";
import yahooAuthService from "./yahooAuth.service.js";
// Helper to normalize Axios errors -> AppError
function wrapYahooError(e) {
    const status = e?.response?.status ?? 500;
    // Try a few likely places for a useful message from Yahoo
    const msg = e?.response?.data?.error_description ||
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Yahoo API request failed";
    throw new AppError(`Yahoo API (${status}): ${msg}`, status);
}
/**
 * Thin service for Yahoo Fantasy *resource* calls.
 * - Gets a fresh Bearer via YahooAuthService
 * - Calls Yahoo Fantasy endpoints
 * - Does not deal with OAuth (kept in YahooAuthService)
 */
export class YahooApiService {
    constructor(auth) {
        this.auth = auth;
    }
    async get(userId, path, params) {
        const token = await this.auth.getOrRefreshAccessToken(userId);
        const url = `${YAHOO_API_URL}${path}?format=${YAHOO_API_FORMAT}`;
        try {
            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });
            return data;
        }
        catch (e) {
            wrapYahooError(e);
        }
    }
    // ---------- Domain helpers ----------
    /** Lists games for the logged-in Yahoo user (NFL, MLB, etc.) */
    getUserGames(userId) {
        return this.get(userId, "/users;use_login=1/games");
    }
    /** League settings (includes auction budget, scoring, roster sizes, etc.) */
    getLeagueSettings(userId, leagueKey) {
        return this.get(userId, `/league/${leagueKey}/settings`);
    }
    /** League teams */
    getLeagueTeams(userId, leagueKey) {
        return this.get(userId, `/league/${leagueKey}/teams`);
    }
    /** League draft results (includes auction prices when applicable) */
    getLeagueDraftResults(userId, leagueKey) {
        return this.get(userId, `/league/${leagueKey}/draftresults`);
    }
    /** Team roster (teamKey looks like "nfl.l.12345.t.7") */
    getTeamRoster(userId, teamKey) {
        return this.get(userId, `/team/${teamKey}/roster`);
    }
    /** League players with optional search/pagination */
    getPlayers(userId, leagueKey, opts) {
        const start = Number(opts?.start ?? 0);
        const count = Number(opts?.count ?? 25);
        let path = `/league/${leagueKey}/players;start=${start};count=${count}`;
        if (opts?.search)
            path += `;search=${encodeURIComponent(opts.search)}`;
        return this.get(userId, path);
    }
    /** League players with projections/rankings data */
    getPlayersWithProjections(userId, leagueKey, opts) {
        const start = Number(opts?.start ?? 0);
        const count = Number(opts?.count ?? 25);
        const path = `/league/${leagueKey}/players;start=${start};count=${count};out=projections,rankings,analysis`;
        return this.get(userId, path);
    }
    /** League players with expert rankings */
    getPlayersWithExpertRankings(userId, leagueKey, opts) {
        const start = Number(opts?.start ?? 0);
        const count = Number(opts?.count ?? 25);
        const path = `/league/${leagueKey}/players;start=${start};count=${count};out=expert_rankings`;
        return this.get(userId, path);
    }
    /** League players with stats */
    getPlayersWithStats(userId, leagueKey, opts) {
        const start = Number(opts?.start ?? 0);
        const count = Number(opts?.count ?? 25);
        const path = `/league/${leagueKey}/players;start=${start};count=${count};out=stats`;
        return this.get(userId, path);
    }
    /** League players with draft analysis (average auction values, ADP) */
    getPlayersWithDraftAnalysis(userId, leagueKey, opts) {
        const start = Number(opts?.start ?? 0);
        const count = Number(opts?.count ?? 25);
        const path = `/league/${leagueKey}/players;start=${start};count=${count};out=draft_analysis`;
        return this.get(userId, path);
    }
    /** Test various Yahoo player data endpoints */
    async testPlayerDataEndpoints(userId, leagueKey, playerId) {
        const testResults = {};
        try {
            console.log('🔍 Testing Yahoo player data endpoints...');
            // Test basic players with different 'out' parameters
            const endpoints = [
                'projections',
                'rankings',
                'analysis',
                'expert_rankings',
                'stats',
                'projections,rankings',
                'projections,rankings,analysis',
                'projections,rankings,analysis,expert_rankings,stats'
            ];
            for (const outParam of endpoints) {
                try {
                    console.log(`📊 Testing players;out=${outParam}...`);
                    const path = `/league/${leagueKey}/players;count=5;out=${outParam}`;
                    const result = await this.get(userId, path);
                    testResults[outParam] = {
                        success: true,
                        hasData: !!result?.fantasy_content?.league?.[1]?.players,
                        samplePlayer: result?.fantasy_content?.league?.[1]?.players?.['0']?.player?.[0]
                    };
                }
                catch (error) {
                    testResults[outParam] = {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }
            // If we have a specific player, test individual player endpoints
            if (playerId) {
                const playerEndpoints = [
                    `player/${leagueKey}.p.${playerId}`,
                    `player/${leagueKey}.p.${playerId};out=projections`,
                    `player/${leagueKey}.p.${playerId};out=rankings`,
                    `player/${leagueKey}.p.${playerId};out=analysis`,
                    `player/${leagueKey}.p.${playerId};out=expert_rankings`,
                    `player/${leagueKey}.p.${playerId};out=stats`
                ];
                for (const endpoint of playerEndpoints) {
                    try {
                        console.log(`🎯 Testing ${endpoint}...`);
                        const result = await this.get(userId, `/${endpoint}`);
                        testResults[`individual_${endpoint.split(';')[1] || 'basic'}`] = {
                            success: true,
                            hasData: !!result?.fantasy_content?.player,
                            data: result?.fantasy_content?.player
                        };
                    }
                    catch (error) {
                        testResults[`individual_${endpoint.split(';')[1] || 'basic'}`] = {
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                }
            }
        }
        catch (error) {
            console.error('❌ Error testing player data endpoints:', error);
        }
        return testResults;
    }
}
// Reuse your existing YahooAuthService instance
export const yahooApiService = new YahooApiService(yahooAuthService);
export default yahooApiService;
//# sourceMappingURL=yahooApi.service.js.map