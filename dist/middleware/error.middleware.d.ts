import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.types.js';
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=error.middleware.d.ts.map