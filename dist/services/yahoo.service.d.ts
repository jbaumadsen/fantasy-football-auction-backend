export declare class YahooService {
    /**
     * Generate Basic Auth header for Yahoo OAuth
     */
    private generateBasicAuth;
    /**
     * Sign OAuth state for security
     */
    signState(payload: any): string;
    /**
     * Verify OAuth state signature
     */
    verifyState(state: string): any | null;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForTokens(code: string): Promise<any>;
    /**
     * Refresh access token if needed
     */
    refreshAccessToken(refreshToken: string): Promise<any>;
    /**
     * Get or refresh access token for a user
     */
    getOrRefreshAccessToken(userId: string): Promise<string>;
    /**
     * Save user tokens to database
     */
    saveUserTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number): Promise<void>;
    /**
     * Make authenticated request to Yahoo API
     */
    makeYahooApiRequest(userId: string, endpoint: string, params?: Record<string, any>): Promise<any>;
    /**
     * Get players from Yahoo Fantasy API
     */
    getPlayers(userId: string, leagueKey: string, search?: string, start?: number, count?: number): Promise<any>;
    /**
     * Get user's Yahoo games
     */
    getUserGames(userId: string): Promise<any>;
    /**
     * Get league settings
     */
    getLeagueSettings(userId: string, leagueKey: string): Promise<any>;
    /**
     * Get league draft results
     */
    getLeagueDraftResults(userId: string, leagueKey: string): Promise<any>;
    /**
     * Get league teams
     */
    getLeagueTeams(userId: string, leagueKey: string): Promise<any>;
    /**
     * Get team roster
     */
    getTeamRoster(userId: string, teamKey: string): Promise<any>;
}
export declare const yahooService: YahooService;
export default yahooService;
//# sourceMappingURL=yahoo.service.d.ts.map