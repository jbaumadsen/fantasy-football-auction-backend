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

export default router;
