/**
 * Rankings Routes
 *
 * API LAYER - Express route handlers for rankings endpoints.
 * This layer handles HTTP concerns (request/response).
 *
 * RULE: No business logic here - delegate to service layer.
 */

import { Router, Request, Response } from "express";
import * as rankingsService from "./rankings.service";
import { RankingsFilters } from "./rankings.types";
import { asyncHandler } from "../../shared/middleware/error-handler";
import { validatePagination, validateDate } from "../../shared/middleware/validation";

const router = Router();

/**
 * GET /api/elo/rankings
 *
 * Get club rankings for a specific date (or the latest available date).
 *
 * Query parameters:
 *   - date: ISO date string (YYYY-MM-DD), optional. Defaults to latest date.
 *   - country: Country code filter (e.g., "ENG"), optional.
 *   - level: League level filter (1, 2, etc.), optional.
 *   - minElo: Minimum Elo rating filter, optional.
 *   - page: Page number for pagination (starts at 1), optional. Defaults to 1.
 *   - pageSize: Number of results per page, optional. Defaults to 100.
 *   - limit: Legacy param, use pageSize instead. Optional.
 *
 * Example:
 *   GET /api/elo/rankings?date=2025-11-18&country=ENG&level=1&page=1&pageSize=20
 *   GET /api/elo/rankings?minElo=1900&pageSize=50
 */
router.get(
  "/",
  validateDate("date"),
  validatePagination,
  asyncHandler(async (req: Request, res: Response) => {
    // Extract and parse query parameters
    const {
      date,
      country,
      level: levelParam,
      minElo: minEloParam,
    } = req.query;

    const level = levelParam ? parseInt(levelParam as string, 10) : undefined;
    const minElo = minEloParam ? parseFloat(minEloParam as string) : undefined;

    // Build filters (pagination is already validated and attached to req)
    const filters: RankingsFilters = {
      date: date as string | undefined,
      country: country as string | undefined,
      level,
      minElo,
      pagination: req.pagination!, // Validated by middleware
    };

    // Delegate to service layer
    const result = await rankingsService.getRankings(filters);

    // Return response
    res.json(result);
  })
);

export default router;
