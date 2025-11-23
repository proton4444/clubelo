/**
 * ClubElo data importer
 *
 * Handles the logic of importing ClubElo CSV data into our database.
 * Upserts clubs and their Elo ratings with proper normalization.
 */

import { db } from "./db";
import { ClubEloRow } from "./clubelo-api";

/**
 * Sanitize club name to create a stable API name
 * Removes special characters and normalizes spacing
 */
function sanitizeApiName(clubName: string): string {
  return clubName.trim();
}

/**
 * Parse a date string in YYYY-MM-DD format or M/D/YYYY format
 */
function parseDate(dateStr: string): Date {
  // ClubElo API returns dates in different formats
  // From field: YYYY-MM-DD
  // Sometimes: M/D/YYYY
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
 * Upsert a single club and its Elo rating into the database
 *
 * This function:
 * 1. Creates or updates the club record
 * 2. Creates or updates the Elo rating for the given date
 */
async function upsertClubRating(row: ClubEloRow, date: Date): Promise<void> {
  const apiName = sanitizeApiName(row.Club);
  const displayName = row.Club.trim();
  const country = row.Country.trim();
  const level = parseInt(row.Level, 10);
  // Handle "None" rank from API (some clubs don't have a rank)
  const rank = row.Rank === "None" ? null : parseInt(row.Rank, 10);
  const elo = parseFloat(row.Elo);

  // Validate parsed values - rank can be null, but level and elo are required
  if (isNaN(level) || isNaN(elo)) {
    console.warn(
      `Skipping invalid row for ${displayName}: level=${row.Level}, elo=${row.Elo}`,
    );
    return;
  }

  // Skip if rank is NaN (not null and not a valid number)
  if (rank !== null && isNaN(rank)) {
    console.warn(
      `Skipping invalid row for ${displayName}: invalid rank=${row.Rank}`,
    );
    return;
  }

  try {
    // Upsert club (create if doesn't exist, update if it does)
    const clubResult = await db.query(
      `INSERT INTO clubs (api_name, display_name, country, level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (api_name)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         country = EXCLUDED.country,
         level = EXCLUDED.level,
         updated_at = NOW()
       RETURNING id`,
      [apiName, displayName, country, level],
    );

    const clubId = clubResult.rows[0].id;

    // Upsert Elo rating for this date
    await db.query(
      `INSERT INTO elo_ratings (club_id, date, rank, country, level, elo, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (club_id, date)
       DO UPDATE SET
         rank = EXCLUDED.rank,
         country = EXCLUDED.country,
         level = EXCLUDED.level,
         elo = EXCLUDED.elo`,
      [clubId, date, rank, country, level, elo, "clubelo"],
    );
  } catch (error) {
    console.error(`Error upserting ${displayName}:`, error);
    throw error;
  }
}

/**
 * Import a daily snapshot of ratings for all clubs
 *
 * @param rows - Array of ClubElo CSV rows
 * @param snapshotDate - The date this snapshot represents
 */
export async function importDailySnapshot(
  rows: ClubEloRow[],
  snapshotDate: Date,
): Promise<void> {
  console.log(
    `\nImporting ${rows.length} club ratings for ${snapshotDate.toISOString().split("T")[0]}...`,
  );

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      await upsertClubRating(row, snapshotDate);
      successCount++;

      // Log progress every 50 clubs
      if (successCount % 50 === 0) {
        console.log(`  Processed ${successCount}/${rows.length} clubs...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  Failed to import ${row.Club}:`, error);
    }
  }

  console.log(
    `\n✓ Import complete: ${successCount} successful, ${errorCount} errors`,
  );
}

/**
 * Import full history for a single club
 *
 * @param rows - Array of ClubElo CSV rows (historical data for one club)
 * @param clubApiName - The API name of the club
 */
export async function importClubHistory(
  rows: ClubEloRow[],
  clubApiName: string,
): Promise<void> {
  console.log(
    `\nImporting ${rows.length} historical ratings for ${clubApiName}...`,
  );

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
        console.log(`  Processed ${successCount}/${rows.length} ratings...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  Failed to import rating from ${row.From}:`, error);
    }
  }

  console.log(
    `\n✓ Import complete: ${successCount} successful, ${errorCount} errors`,
  );
}
