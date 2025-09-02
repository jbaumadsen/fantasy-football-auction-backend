export declare class PlayerService {
    private lastUpdateTime;
    private readonly UPDATE_INTERVAL_MS;
    getPlayers(userId: string, leagueKey: string, limit?: number): Promise<any[]>;
    private updatePlayerDataInBackground;
    private transformYahooPlayers;
    private extractPlayerData;
    private getPlayersFromDatabase;
    private storePlayersInDatabase;
    private getPositionType;
    private getMockPlayers;
    fetchAllPlayersFromYahoo(userId: string, leagueKey: string, limit?: number): Promise<any[]>;
}
export declare const playerService: PlayerService;
export default playerService;
//# sourceMappingURL=player.service.d.ts.map