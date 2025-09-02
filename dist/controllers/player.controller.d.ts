import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/authenticatedRequest.types.js';
export declare const playerController: {
    getPlayers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getPlayerById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    testYahooEndpoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=player.controller.d.ts.map