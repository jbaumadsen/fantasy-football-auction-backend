export declare class DraftService {
    /**
     * Get players with draft analysis data (includes average auction $ and ADP)
     * This is the data that IS available from Yahoo's API
     */
    getPlayersWithDraftAnalysis(userId: string, leagueKey: string, limit?: number): Promise<any[]>;
    /**
     * Get draft results for the league (includes actual auction prices)
     * This is post-draft data showing what players actually sold for
     */
    getLeagueDraftResults(userId: string, leagueKey: string): Promise<any[]>;
    /**
     * Get league settings including auction budget and draft settings
     */
    getLeagueSettings(userId: string, leagueKey: string): Promise<any>;
    /**
     * Get league teams and their current auction budgets
     */
    getLeagueTeams(userId: string, leagueKey: string): Promise<any[]>;
    /**
     * Transform Yahoo player data with draft analysis
     */
    private transformYahooPlayersWithDraftAnalysis;
    /**
     * Transform draft results data
     */
    private transformDraftResults;
    /**
     * Extract player data with draft analysis fields
     */
    private extractPlayerDataWithDraftAnalysis;
    /**
     * Extract draft result data
     */
    private extractDraftResultData;
    /**
     * Transform league settings data
     */
    private transformLeagueSettings;
    /**
     * Transform league teams data
     */
    private transformLeagueTeams;
}
export declare const draftService: DraftService;
export default draftService;
//# sourceMappingURL=draft.service.d.ts.map