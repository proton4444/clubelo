/**
 * Data Importer Service
 *
 * BUSINESS LOGIC - Orchestrates importing ClubElo data into our database.
 * Uses the clubs module's upsertClub via public API (not direct repository access).
 *
 * Moved from: src/lib/importer.ts
 * Key improvements:
 * - Uses transaction wrapper for atomic operations
 * - Delegates to clubs module via public API
 * - Better error handling and logging
 */

import { ClubEloRow } from "./clubelo-client";
import { upsertClub } from "../clubs";
import { db } from "../../shared/database/connection";
import { withTransaction } from "../../shared/database/transaction";
import { logger } from "../../shared/utils/logger";
import { formatDateOnly } from "../../shared/utils/date-formatter";

/**
 * Sanitize club name to create a stable API name
 */
function sanitizeApiName(clubName: string): string {
  return clubName.trim();
}

/**
 * Parse a date string in YYYY-MM-DD or M/D/YYYY format
 */
function parseDate(dateStr: string): Date {
  if (dateStr.includes("/")) {
    // Parse M/D/YYYY format
    const [month, day, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  } else {
    // Parse YYYY-MM-DD format
    return new Date(dateStr);
  }
}

/**
 * Validate and parse a ClubElo row
 */
function parseClubEloRow(row: ClubEloRow): {
  apiName: string;
  displayName: string;
  country: string;
  level: number;
  rank: number | null;
  elo: number;
} | null {
  const apiName = sanitizeApiName(row.Club);
  const displayName = row.Club.trim();
  const country = row.Country.trim();
  const level = parseInt(row.Level, 10);

  // Handle "None" rank from API (some clubs don't have a rank)
  const rank = row.Rank === "None" ? null : parseInt(row.Rank, 10);
  const elo = parseFloat(row.Elo);

  // Validate parsed values
  if (isNaN(level) || isNaN(elo)) {
    logger.warn(`Skipping invalid row for ${displayName}`, {
      level: row.Level,
      elo: row.Elo,
    });
    return null;
  }

  // Skip if rank is NaN (not null and not a valid number)
  if (rank !== null && isNaN(rank)) {
    logger.warn(`Skipping invalid rank for ${displayName}`, {
      rank: row.Rank,
    });
    return null;
  }

  return {
    apiName,
    displayName,
    country,
    level,
    rank,
    elo,
  };
}

/**
 * Upsert a single club and its Elo rating
 *
 * Uses transaction to ensure atomicity.
 */
async function upsertClubRating(
  row: ClubEloRow,
  date: Date
): Promise<void> {
  const parsed = parseClubEloRow(row);
  if (!parsed) {
    return; // Skip invalid rows
  }

  const { apiName, displayName, country, level, rank, elo } = parsed;

  await withTransaction(async (client) => {
    // Step 1: Upsert club using clubs module's public API
    const clubId = await upsertClub({
      apiName,
      displayName,
      country,
      level,
    });

    // Step 2: Upsert Elo rating for this date
    await client.query(
      `INSERT INTO elo_ratings (club_id, date, rank, country, level, elo, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (club_id, date)
       DO UPDATE SET
         rank = EXCLUDED.rank,
         country = EXCLUDED.country,
         level = EXCLUDED.level,
         elo = EXCLUDED.elo`,
      [clubId, date, rank, country, level, elo, "clubelo"]
    );
  });
}

/**
 * Import a daily snapshot of ratings for all clubs
 *
 * @param rows - Array of ClubElo CSV rows
 * @param snapshotDate - The date this snapshot represents
 * @returns Statistics about the import
 */
export async function importDailySnapshot(
  rows: ClubEloRow[],
  snapshotDate: Date
): Promise<{ success: number; errors: number }> {
  const dateStr = formatDateOnly(snapshotDate)!;
  logger.info(`Importing ${rows.length} club ratings for ${dateStr}`);

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      await upsertClubRating(row, snapshotDate);
      successCount++;

      // Log progress every 50 clubs
      if (successCount % 50 === 0) {
        logger.debug(`Processed ${successCount}/${rows.length} clubs`);
      }
    } catch (error) {
      errorCount++;
      logger.error(`Failed to import ${row.Club}`, {
        error: (error as Error).message,
      });
    }
  }

  logger.info(`Import complete for ${dateStr}`, {
    success: successCount,
    errors: errorCount,
  });

  return { success: successCount, errors: errorCount };
}

/**
 * Import full history for a single club
 *
 * @param rows - Array of ClubElo CSV rows (historical data for one club)
 * @param clubApiName - The API name of the club
 * @returns Statistics about the import
 */
export async function importClubHistory(
  rows: ClubEloRow[],
  clubApiName: string
): Promise<{ success: number; errors: number }> {
  logger.info(`Importing ${rows.length} historical ratings for ${clubApiName}`);

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      // Parse the "From" date from the row
      const date = parseDate(row.From);
      await upsertClubRating(row, date);
      successCount++;

      // Log progress every 100 entries
      if (successCount % 100 === 0) {
        logger.debug(`Processed ${successCount}/${rows.length} ratings`);
      }
    } catch (error) {
      errorCount++;
      logger.error(`Failed to import rating from ${row.From}`, {
        error: (error as Error).message,
      });
    }
  }

  logger.info(`Import complete for ${clubApiName}`, {
    success: successCount,
    errors: errorCount,
  });

  return { success: successCount, errors: errorCount };
}
