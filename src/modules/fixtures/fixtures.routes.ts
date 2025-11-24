/**
 * Fixtures Routes
 *
 * API LAYER - Express route handlers for fixtures endpoints.
 *
 * RULE: No business logic here - delegate to service layer.
 */

import { Router, Request, Response } from "express";
import * as fixturesService from "./fixtures.service";
import { FixtureFilters } from "./fixtures.types";
import { asyncHandler } from "../../shared/middleware/error-handler";
import { validateDate, validateDateRange } from "../../shared/middleware/validation";

const router = Router();

/**
 * GET /api/elo/fixtures
 *
 * Get upcoming or recent match fixtures with Elo-based predictions.
 *
 * Query parameters:
 *   - date: Single date (YYYY-MM-DD) or date range, optional
 *   - from: Start date for range (YYYY-MM-DD), optional
 *   - to: End date for range (YYYY-MM-DD), optional
 *   - country: Filter by country code, optional
 *   - competition: Filter by competition name, optional
 *   - limit: Maximum number of results, optional. Defaults to 100.
 *
 * Example:
 *   GET /api/elo/fixtures
 *   GET /api/elo/fixtures?date=2025-11-20
 *   GET /api/elo/fixtures?from=2025-11-20&to=2025-11-30
 *   GET /api/elo/fixtures?country=ENG&competition=Premier%20League
 */
router.get(
  "/",
  validateDate("date"),
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      date,
      from,
      to,
      country,
      competition,
      limit: limitParam,
    } = req.query;

    const limit = limitParam ? parseInt(limitParam as string, 10) : undefined;

    const filters: FixtureFilters = {
      date: date as string | undefined,
      dateRange:
        from || to
          ? {
              from: from as string | undefined,
              to: to as string | undefined,
            }
          : undefined,
      country: country as string | undefined,
      competition: competition as string | undefined,
      limit,
    };

    const result = await fixturesService.getFixtures(filters);
    res.json(result);
  })
);

export default router;
