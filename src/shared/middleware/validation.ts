/**
 * Request Validation Middleware
 *
 * Provides reusable validation helpers for API requests.
 * Uses Zod for runtime type checking and validation.
 * Replaces manual parsing and validation in server.ts.
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiError } from "./error-handler";
import { isValidDateString } from "../utils/date-formatter";
import { validateQueryParams } from "../validation/schemas";

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const {
    page: pageParam,
    pageSize: pageSizeParam,
    limit: limitParam,
  } = req.query;

  // Parse pagination
  const page = pageParam ? parseInt(pageParam as string, 10) : 1;
  const pageSize = pageSizeParam
    ? parseInt(pageSizeParam as string, 10)
    : limitParam
      ? parseInt(limitParam as string, 10)
      : 100;

  // Validate
  if (page < 1) {
    throw new ApiError(400, "Page must be >= 1");
  }
  if (pageSize < 1 || pageSize > 1000) {
    throw new ApiError(400, "Page size must be between 1 and 1000");
  }

  // Attach to request
  req.pagination = { page, pageSize };
  next();
}

/**
 * Validate optional date parameter
 */
export function validateDate(paramName: string = "date") {
  return (req: Request, res: Response, next: NextFunction) => {
    const dateParam = req.query[paramName] as string | undefined;

    if (dateParam && !isValidDateString(dateParam)) {
      throw new ApiError(400, `Invalid ${paramName} format. Use YYYY-MM-DD`);
    }

    next();
  };
}

/**
 * Validate date range parameters
 */
export function validateDateRange(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { from, to } = req.query;

  if (from && !isValidDateString(from as string)) {
    throw new ApiError(400, "Invalid 'from' date format. Use YYYY-MM-DD");
  }

  if (to && !isValidDateString(to as string)) {
    throw new ApiError(400, "Invalid 'to' date format. Use YYYY-MM-DD");
  }

  next();
}

/**
 * Validate cron secret for protected endpoints
 */
export function validateCronSecret(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new ApiError(500, "CRON_SECRET not configured");
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    throw new ApiError(401, "Unauthorized");
  }

  next();
}

/**
 * Generic Zod validation middleware
 *
 * Validates query parameters against a Zod schema.
 * Attaches validated and typed data to req.validated
 *
 * @example
 * ```typescript
 * router.get('/', validateQuery(rankingsFiltersSchema), async (req, res) => {
 *   const filters = req.validated; // Fully typed!
 *   // ...
 * });
 * ```
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = validateQueryParams(schema, req.query);
      req.validated = validated;
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.issues
          .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new ApiError(400, `Validation error: ${message}`);
      }
      throw error;
    }
  };
}

// Extend Express Request type to include validated data and pagination
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        pageSize: number;
      };
      validated?: any; // Will be properly typed based on schema
    }
  }
}
