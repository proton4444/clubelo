/**
 * Cron Routes
 *
 * API LAYER - Express route handlers for scheduled import jobs.
 * These endpoints are called by Vercel Cron or other schedulers.
 *
 * Protected by CRON_SECRET authentication.
 */

import { Router, Request, Response } from "express";
import * as clubeloClient from "./clubelo-client";
import * as dataImporter from "./data-importer.service";
import * as fixturesImporter from "./fixtures-importer.service";
import { asyncHandler } from "../../shared/middleware/error-handler";
import { validateCronSecret } from "../../shared/middleware/validation";
import { getYesterday } from "../../shared/utils/date-formatter";
import { logger } from "../../shared/utils/logger";

const router = Router();

/**
 * POST /api/cron/import-daily
 *
 * Import daily snapshot of club ratings from ClubElo API.
 *
 * Query parameters:
 *   - date: Date in YYYY-MM-DD format (optional, defaults to yesterday)
 *
 * Authentication:
 *   - Requires Authorization: Bearer <CRON_SECRET>
 *
 * Example:
 *   POST /api/cron/import-daily?date=2025-11-20
 *   Headers: Authorization: Bearer <secret>
 */
router.post(
  "/import-daily",
  validateCronSecret,
  asyncHandler(async (req: Request, res: Response) => {
    const dateStr = (req.query.date as string) || getYesterday();

    logger.info(`Starting daily import for ${dateStr}`);

    // Step 1: Fetch data from ClubElo API
    const rows = await clubeloClient.fetchDailySnapshot(dateStr);

    if (rows.length === 0) {
      logger.warn(`No data found for ${dateStr}`);
      return res.json({
        success: true,
        count: 0,
        message: "No data found",
        date: dateStr,
      });
    }

    // Step 2: Import to database
    const stats = await dataImporter.importDailySnapshot(
      rows,
      new Date(dateStr)
    );

    res.json({
      success: true,
      date: dateStr,
      fetched: rows.length,
      imported: stats.success,
      errors: stats.errors,
    });
  })
);

/**
 * POST /api/cron/import-fixtures
 *
 * Import upcoming fixtures from ClubElo API.
 *
 * Query parameters:
 *   - date: Date in YYYY-MM-DD format (optional, fetches all upcoming if not provided)
 *
 * Authentication:
 *   - Requires Authorization: Bearer <CRON_SECRET>
 *
 * Example:
 *   POST /api/cron/import-fixtures
 *   POST /api/cron/import-fixtures?date=2025-11-20
 *   Headers: Authorization: Bearer <secret>
 */
router.post(
  "/import-fixtures",
  validateCronSecret,
  asyncHandler(async (req: Request, res: Response) => {
    const date = req.query.date as string | undefined;

    logger.info(
      date
        ? `Starting fixtures import for ${date}`
        : "Starting fixtures import for upcoming matches"
    );

    // Step 1: Fetch fixtures from ClubElo API
    const rows = await clubeloClient.fetchFixtures(date);

    if (rows.length === 0) {
      logger.warn("No fixtures found");
      return res.json({
        success: true,
        count: 0,
        message: "No fixtures found",
      });
    }

    // Step 2: Import to database
    const stats = await fixturesImporter.importFixtures(rows);

    res.json({
      success: true,
      fetched: rows.length,
      imported: stats.success,
      errors: stats.errors,
    });
  })
);

export default router;
