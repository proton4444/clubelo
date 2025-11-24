/**
 * Clubs Routes
 *
 * API LAYER - Express route handlers for clubs endpoints.
 *
 * RULE: No business logic here - delegate to service layer.
 */

import { Router, Request, Response } from "express";
import * as clubsService from "./clubs.service";
import { asyncHandler } from "../../shared/middleware/error-handler";
import { validateDateRange } from "../../shared/middleware/validation";

const router = Router();

/**
 * GET /api/elo/clubs
 *
 * List all clubs (useful for dropdowns, search, etc.)
 *
 * Query parameters:
 *   - q: Search query (searches in display name), optional
 *   - country: Filter by country code, optional
 *   - level: Filter by league level, optional
 *   - limit: Maximum number of results, optional. Defaults to 100.
 *
 * Example:
 *   GET /api/elo/clubs?q=Man
 *   GET /api/elo/clubs?country=ENG&limit=50
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { q, country, level: levelParam, limit: limitParam } = req.query;

    const level = levelParam ? parseInt(levelParam as string, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam as string, 10) : undefined;

    const result = await clubsService.searchClubs({
      query: q as string | undefined,
      country: country as string | undefined,
      level,
      limit,
    });

    res.json(result);
  })
);

/**
 * GET /api/elo/clubs/:id/history
 *
 * Get the full Elo rating history for a specific club.
 *
 * Path parameters:
 *   - id: Club ID (integer) or API name (string)
 *
 * Query parameters:
 *   - from: Start date (YYYY-MM-DD), optional. Defaults to earliest.
 *   - to: End date (YYYY-MM-DD), optional. Defaults to latest.
 *
 * Example:
 *   GET /api/elo/clubs/1/history?from=2024-01-01&to=2024-12-31
 *   GET /api/elo/clubs/ManCity/history
 */
router.get(
  "/:id/history",
  validateDateRange,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { from, to } = req.query;

    const result = await clubsService.getClubHistory(
      id,
      from as string | undefined,
      to as string | undefined
    );

    res.json(result);
  })
);

export default router;
