import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/authenticatedRequest.types.js";
export declare const appAuthMiddleware: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map