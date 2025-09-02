import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/authenticatedRequest.types.js';
import { playerService } from '../services/player.service.js';
import { AppError } from '../types/error.types.js';

export const playerController = {
  async getPlayers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    } catch (error) {
      next(error);
    }
  },

  async syncPlayers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { leagueKey, limit = 100 } = req.body as { leagueKey?: string; limit?: number };

      if (!leagueKey || typeof leagueKey !== 'string') {
        throw new AppError('leagueKey is required in request body', 400);
      }
      // Validate Yahoo league key format to avoid passing DB ids by mistake
      const isYahooKey = /^(\d+\.l\.\d+|nfl\.l\.\d+)$/i.test(leagueKey);
      if (!isYahooKey) {
        throw new AppError(`Invalid leagueKey format. Expected Yahoo league key like "461.l.123456" (or "nfl.l.123456"), got "${leagueKey}"`, 400);
      }
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const players = await playerService.fetchAllPlayersFromYahoo(userId, leagueKey, Number(limit ?? 100));

      res.json({
        success: true,
        leagueKey,
        count: players.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getPlayerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    } catch (error) {
      next(error);
    }
  },

  async testYahooEndpoints(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      
      const testResults = await yahooApiService.testPlayerDataEndpoints(
        userId, 
        leagueKey, 
        playerId as string
      );

      res.json({
        success: true,
        data: testResults,
        message: 'Yahoo endpoint testing completed'
      });
    } catch (error) {
      next(error);
    }
  }
};
