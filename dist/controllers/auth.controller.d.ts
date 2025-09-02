import type { AuthenticatedRequest } from "../types/authenticatedRequest.types.js";
import { NextFunction, Request, Response } from "express";
export declare const getYahooAuthUrl: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getYahooCallback: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const deleteYahooAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map