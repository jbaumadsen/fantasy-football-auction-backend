import { Router } from 'express';
import { playerController } from '../controllers/player.controller.js';
import { appAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Get players with optional limit
router.get('/', appAuthMiddleware(["user"]), playerController.getPlayers);

// Get specific player by ID
router.get('/:id', appAuthMiddleware(["user"]), playerController.getPlayerById);

// Test Yahoo API endpoints for player data
router.get('/test/yahoo-endpoints', appAuthMiddleware(["user"]), playerController.testYahooEndpoints);

// Admin: trigger a full sync of players from Yahoo into DB
router.post('/sync', appAuthMiddleware(["user"]), playerController.syncPlayers);

export default router;
