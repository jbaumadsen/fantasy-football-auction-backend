import { playerService } from '../services/player.service.js';
import { AppError } from '../types/error.types.js';
export const playerController = {
    async getPlayers(req, res, next) {
        console.log('getPlayers');
        try {
            const { leagueKey, limit = 100 } = req.query;
            const userId = req.userId;
            if (!leagueKey || typeof leagueKey !== 'string') {
                throw new AppError('leagueKey is required', 400);
            }
            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }
            const players = await playerService.getPlayers(userId, leagueKey, Number(limit));
            res.json({
                success: true,
                data: players,
                count: players.length,
                message: 'Players retrieved successfully'
            });
        }
        catch (error) {
            next(error);
        }
    },
    async getPlayerById(req, res, next) {
        try {
            const { id } = req.params;
            const { leagueKey } = req.query;
            const userId = req.userId;
            if (!leagueKey || typeof leagueKey !== 'string') {
                throw new AppError('leagueKey is required', 400);
            }
            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }
            // TODO: Implement getPlayerById in service
            res.json({
                success: true,
                data: { id, message: 'Not implemented yet' },
                message: 'Player details retrieved successfully'
            });
        }
        catch (error) {
            next(error);
        }
    },
    async testYahooEndpoints(req, res, next) {
        try {
            const { leagueKey, playerId } = req.query;
            const userId = req.userId;
            if (!leagueKey || typeof leagueKey !== 'string') {
                throw new AppError('leagueKey is required', 400);
            }
            if (!userId) {
                throw new AppError('User not authenticated', 401);
            }
            // Import yahooApiService to use the test method
            const { yahooApiService } = await import('../services/yahooApi.service.js');
            const testResults = await yahooApiService.testPlayerDataEndpoints(userId, leagueKey, playerId);
            res.json({
                success: true,
                data: testResults,
                message: 'Yahoo endpoint testing completed'
            });
        }
        catch (error) {
            next(error);
        }
    }
};
//# sourceMappingURL=player.controller.js.map