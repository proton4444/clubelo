/**
 * Rankings Routes (WITH ZOD VALIDATION)
 *
 * API LAYER - Example of using Zod validation.
 * This is an ALTERNATIVE implementation showing best practices.
 *
 * Compare this to rankings.routes.ts to see the improvement.
 */

import { Router, Request, Response } from "express";
import * as rankingsService from "./rankings.service";
import { RankingsFilters } from "./rankings.types";
import { asyncHandler } from "../../shared/middleware/error-handler";
import { validateQuery } from "../../shared/middleware/validation";
import { rankingsFiltersSchema } from "../../shared/validation/schemas";

const router = Router();

/**
 * GET /api/elo/rankings
 *
 * Get club rankings with full Zod validation.
 *
 * This version automatically:
 * - Validates all query parameters
 * - Converts strings to correct types
 * - Provides detailed error messages
 * - Type-safe access to validated data
 */
router.get(
  "/",
  validateQuery(rankingsFiltersSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // req.validated is now fully typed and validated!
    const validated = req.validated as {
      date?: string;
      country?: string;
      level?: number;
      minElo?: number;
      page: number;
      pageSize: number;
    };

    // Build filters from validated data
    const filters: RankingsFilters = {
      date: validated.date,
      country: validated.country,
      level: validated.level,
      minElo: validated.minElo,
      pagination: {
        page: validated.page,
        pageSize: validated.pageSize,
      },
    };

    // Delegate to service
    const result = await rankingsService.getRankings(filters);

    // Return response
    res.json(result);
  })
);

export default router;

/*
 * COMPARISON:
 *
 * OLD WAY (rankings.routes.ts):
 * ❌ Manual parsing: parseInt(levelParam as string, 10)
 * ❌ Manual validation: if (page < 1) throw error
 * ❌ No type safety on query params
 * ❌ Duplicate validation logic
 *
 * NEW WAY (this file):
 * ✅ Automatic parsing by Zod
 * ✅ Schema-based validation
 * ✅ Type-safe access via req.validated
 * ✅ Centralized schemas (reusable)
 * ✅ Better error messages
 */
