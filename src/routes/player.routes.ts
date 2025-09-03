import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';
import { appAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Get players with optional limit
router.get('/', appAuthMiddleware(["user"]), playerController.getPlayers);

// Get players enriched with league analyses (average draft value) - MUST come before /:id
router.get('/with-analyses', appAuthMiddleware(["user"]), playerController.getPlayersWithAnalyses);

// Test Yahoo API endpoints for player data
router.get('/test/yahoo-endpoints', appAuthMiddleware(["user"]), playerController.testYahooEndpoints);

// Admin: trigger a full sync of players from Yahoo into DB
router.post('/sync', appAuthMiddleware(["user"]), playerController.syncPlayers);

// Get specific player by ID - MUST come after specific routes
router.get('/:id', appAuthMiddleware(["user"]), playerController.getPlayerById);

// My$ (User's custom player values) routes
router.put('/my-value', appAuthMiddleware(["user"]), playerController.updatePlayerValue);
router.get('/my-values', appAuthMiddleware(["user"]), playerController.getPlayerValues);
router.post('/my-values/copy', appAuthMiddleware(["user"]), playerController.copyMyValuesFromLeagueToAnotherController);

export default router;
