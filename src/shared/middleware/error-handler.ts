/**
 * Error Handling Middleware
 *
 * Centralized error handling for Express routes.
 * Replaces scattered try/catch blocks in server.ts.
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async route handler wrapper
 *
 * Wraps async route handlers to catch errors automatically.
 *
 * @example
 * ```typescript
 * app.get('/api/clubs', asyncHandler(async (req, res) => {
 *   const clubs = await clubsService.getClubs();
 *   res.json(clubs);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 *
 * Place this LAST in your middleware chain:
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error("Request error", {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Handle unknown errors (don't leak details in production)
  const statusCode = 500;
  const message = "Internal server error";

  res.status(statusCode).json({ error: message });
}
