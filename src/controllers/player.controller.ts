import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/authenticatedRequest.types.js';
import { playerService } from '../services/player.service.js';
import { AppError } from '../types/error.types.js';
import PlayerValue from '../models/playerValue.model.js';

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

  async getPlayersWithAnalyses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      console.log('🔍 getPlayersWithAnalyses called');
      const { leagueKey, limit = 100 } = req.query as { leagueKey?: string; limit?: string | number };
      const userId = req.userId;

      console.log('📊 Request params:', { leagueKey, limit, userId });
      console.log('📊 Request URL:', req.url);
      console.log('📊 Request method:', req.method);

      if (!leagueKey || typeof leagueKey !== 'string') {
        console.log('❌ Missing leagueKey');
        throw new AppError('leagueKey is required', 400);
      }
      if (!userId) {
        console.log('❌ Missing userId');
        throw new AppError('User not authenticated', 401);
      }

      console.log('🚀 Calling playerService.getPlayersWithAnalyses...');
      const players = await playerService.getPlayersWithAnalyses(userId, leagueKey, Number(limit ?? 100));
      console.log('✅ Got players:', players.length);
      console.log('📊 Sample player data:', players.slice(0, 2));
      
      res.json({ success: true, data: players, count: players.length });
    } catch (error) {
      console.error('❌ Error in getPlayersWithAnalyses:', error);
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
  },

  // My$ (User's custom player values) endpoints
  async updatePlayerValue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      console.log('🎯 updatePlayerValue endpoint called');
      console.log('🎯 Request body:', req.body);
      console.log('🎯 Request method:', req.method);
      console.log('🎯 Request URL:', req.url);
      
      const userId = req.userId;
      const { leagueKey, yahooPlayerKey, playerName, myValue } = req.body;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!leagueKey || !yahooPlayerKey || !playerName) {
        throw new AppError('leagueKey, yahooPlayerKey, and playerName are required', 400);
      }

      if (myValue !== null && (typeof myValue !== 'number' || myValue < 0)) {
        throw new AppError('myValue must be null or a non-negative number', 400);
      }

      // Normalize league key
      const normalizedLeagueKey = leagueKey.replace(/^\d+\.l\./, 'nfl.l.');

      // Upsert the player value
      const playerValue = await PlayerValue.findOneAndUpdate(
        { userId, leagueKey: normalizedLeagueKey, yahooPlayerKey },
        { playerName, myValue },
        { upsert: true, new: true }
      );

      res.json({ 
        success: true, 
        data: playerValue,
        message: 'Player value updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getPlayerValues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { leagueKey } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!leagueKey || typeof leagueKey !== 'string') {
        throw new AppError('leagueKey is required', 400);
      }

      // Normalize league key
      const normalizedLeagueKey = leagueKey.replace(/^\d+\.l\./, 'nfl.l.');

      const playerValues = await PlayerValue.find({
        userId,
        leagueKey: normalizedLeagueKey
      }).lean();

      // Convert to a map for easy lookup
      const valueMap: Record<string, number | null> = {};
      playerValues.forEach(pv => {
        valueMap[pv.yahooPlayerKey] = pv.myValue;
      });

      res.json({ 
        success: true, 
        data: valueMap,
        count: playerValues.length
      });
    } catch (error) {
      next(error);
    }
  }
};
