import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.types.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.error('ErrorHandler line 11: AppError', err);
    return res.status(err.statusCode).json({
      status: err.status, // Derived directly from AppError
      message: err.message,
    });
  }

  console.error('ErrorHandler line 19: NON-APPERROR', err);

  return res.status(500).json({
    status: 'error', // Default for generic errors
    message: 'Internal server error',
  });
};
