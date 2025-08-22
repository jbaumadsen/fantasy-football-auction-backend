import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`LoggingMiddleware line 8: [${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Log the request body if it exists
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('LoggingMiddleware line 12: Request Body:', req.body);
  }

  const originalSend = res.send;
  res.send = function(body: any) {
    console.log(`LoggingMiddleware line 18: [${new Date().toISOString()}] Response Body:`, body);
    return originalSend.call(this, body);
  };

  next();
};
