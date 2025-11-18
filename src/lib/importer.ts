/**
 * ClubElo data importer
 *
 * Handles the logic of importing ClubElo CSV data into our database.
 * Upserts clubs and their Elo ratings with proper normalization.
 */

import { prisma } from './db';
import { ClubEloRow } from './clubelo-api';

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
  if (dateStr.includes('/')) {
    // Parse M/D/YYYY format
    const [month, day, year] = dateStr.split('/').map(Number);
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
  const rank = parseInt(row.Rank, 10);
  const elo = parseFloat(row.Elo);

  // Validate parsed values
  if (isNaN(level) || isNaN(rank) || isNaN(elo)) {
    console.warn(`Skipping invalid row for ${displayName}: level=${row.Level}, rank=${row.Rank}, elo=${row.Elo}`);
    return;
  }

  try {
    // Upsert club (create if doesn't exist, update if it does)
    const club = await prisma.club.upsert({
      where: { apiName },
      create: {
        apiName,
        displayName,
        country,
        level,
      },
      update: {
        // Update fields that might have changed
        displayName,
        country,
        level,
      },
    });

    // Upsert Elo rating for this date
    await prisma.eloRating.upsert({
      where: {
        clubId_date: {
          clubId: club.id,
          date,
        },
      },
      create: {
        clubId: club.id,
        date,
        rank,
        country,
        level,
        elo,
        source: 'clubelo',
      },
      update: {
        rank,
        country,
        level,
        elo,
      },
    });

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
export async function importDailySnapshot(rows: ClubEloRow[], snapshotDate: Date): Promise<void> {
  console.log(`\nImporting ${rows.length} club ratings for ${snapshotDate.toISOString().split('T')[0]}...`);

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

  console.log(`\n✓ Import complete: ${successCount} successful, ${errorCount} errors`);
}

/**
 * Import full history for a single club
 *
 * @param rows - Array of ClubElo CSV rows (historical data for one club)
 * @param clubApiName - The API name of the club
 */
export async function importClubHistory(rows: ClubEloRow[], clubApiName: string): Promise<void> {
  console.log(`\nImporting ${rows.length} historical ratings for ${clubApiName}...`);

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

  console.log(`\n✓ Import complete: ${successCount} successful, ${errorCount} errors`);
}
