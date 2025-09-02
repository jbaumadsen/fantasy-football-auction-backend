import type { YahooAuthService } from "./yahooAuth.service.js";
/**
 * Thin service for Yahoo Fantasy *resource* calls.
 * - Gets a fresh Bearer via YahooAuthService
 * - Calls Yahoo Fantasy endpoints
 * - Does not deal with OAuth (kept in YahooAuthService)
 */
export declare class YahooApiService {
    private auth;
    constructor(auth: YahooAuthService);
    private get;
    /** Lists games for the logged-in Yahoo user (NFL, MLB, etc.) */
    getUserGames(userId: string): Promise<any>;
    /** League settings (includes auction budget, scoring, roster sizes, etc.) */
    getLeagueSettings(userId: string, leagueKey: string): Promise<any>;
    /** League teams */
    getLeagueTeams(userId: string, leagueKey: string): Promise<any>;
    /** League draft results (includes auction prices when applicable) */
    getLeagueDraftResults(userId: string, leagueKey: string): Promise<any>;
    /** Team roster (teamKey looks like "nfl.l.12345.t.7") */
    getTeamRoster(userId: string, teamKey: string): Promise<any>;
    /** League players with optional search/pagination */
    getPlayers(userId: string, leagueKey: string, opts?: {
        search?: string;
        start?: number;
        count?: number;
    }): Promise<any>;
    /** League players with projections/rankings data */
    getPlayersWithProjections(userId: string, leagueKey: string, opts?: {
        start?: number;
        count?: number;
    }): Promise<any>;
    /** League players with expert rankings */
    getPlayersWithExpertRankings(userId: string, leagueKey: string, opts?: {
        start?: number;
        count?: number;
    }): Promise<any>;
    /** League players with stats */
    getPlayersWithStats(userId: string, leagueKey: string, opts?: {
        start?: number;
        count?: number;
    }): Promise<any>;
    /** League players with draft analysis (average auction values, ADP) */
    getPlayersWithDraftAnalysis(userId: string, leagueKey: string, opts?: {
        start?: number;
        count?: number;
    }): Promise<any>;
    /** Test various Yahoo player data endpoints */
    testPlayerDataEndpoints(userId: string, leagueKey: string, playerId?: string): Promise<any>;
}
export declare const yahooApiService: YahooApiService;
export default yahooApiService;
//# sourceMappingURL=yahooApi.service.d.ts.map