/**
 * Fixtures Importer Service
 *
 * BUSINESS LOGIC - Orchestrates importing fixture data from ClubElo.
 * Uses transaction wrapper to ensure atomicity.
 *
 * Moved from: src/lib/fixtures-importer.ts
 * Key improvements:
 * - Uses withTransaction for atomic operations (fixes the bug!)
 * - Delegates to clubs and fixtures modules via public APIs
 * - Better error handling and logging
 */

import { ClubEloFixtureRow } from "./clubelo-client";
import { upsertClub } from "../clubs";
import { upsertFixture } from "../fixtures";
import { withTransaction } from "../../shared/database/transaction";
import { logger } from "../../shared/utils/logger";
import { formatDateOnly } from "../../shared/utils/date-formatter";

/**
 * Find or create a club by name
 *
 * Returns the club ID.
 * Uses the clubs module's public API.
 */
async function findOrCreateClub(
  clubName: string,
  country: string,
  level: number
): Promise<number> {
  const apiName = clubName.trim();
  const displayName = clubName.trim();

  // Use clubs module's upsertClub function
  const clubId = await upsertClub({
    apiName,
    displayName,
    country,
    level,
  });

  return clubId;
}

/**
 * Parse and validate a fixture row
 */
function parseFixtureRow(row: ClubEloFixtureRow): {
  matchDate: string;
  country: string;
  competition: string;
  homeLevel: number;
  awayLevel: number;
  homeElo: number;
  awayElo: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
} | null {
  // Parse fixture data
  const matchDate = formatDateOnly(new Date(row.Date))!;
  const country = row.Country.trim();
  const competition = row.Competition?.trim() || "";
  const homeLevel = parseInt(row.HomeLevel, 10);
  const awayLevel = parseInt(row.AwayLevel, 10);
  const homeElo = parseFloat(row.HomeElo);
  const awayElo = parseFloat(row.AwayElo);
  const homeWinProb = parseFloat(row.HomeProbW);
  const drawProb = parseFloat(row.ProbD);
  const awayWinProb = parseFloat(row.AwayProbW);

  // Validate parsed values
  if (isNaN(homeElo) || isNaN(awayElo)) {
    logger.warn(`Skipping invalid fixture: ${row.HomeTeam} vs ${row.AwayTeam}`, {
      homeElo: row.HomeElo,
      awayElo: row.AwayElo,
    });
    return null;
  }

  return {
    matchDate,
    country,
    competition,
    homeLevel,
    awayLevel,
    homeElo,
    awayElo,
    homeWinProb,
    drawProb,
    awayWinProb,
  };
}

/**
 * Import a single fixture
 *
 * Uses transaction to ensure all operations succeed or fail together.
 */
async function importSingleFixture(row: ClubEloFixtureRow): Promise<void> {
  const parsed = parseFixtureRow(row);
  if (!parsed) {
    return; // Skip invalid rows
  }

  const {
    matchDate,
    country,
    competition,
    homeLevel,
    awayLevel,
    homeElo,
    awayElo,
    homeWinProb,
    drawProb,
    awayWinProb,
  } = parsed;

  // Use transaction wrapper to ensure atomicity
  await withTransaction(async () => {
    // Step 1: Find or create home club
    const homeClubId = await findOrCreateClub(
      row.HomeTeam,
      country,
      homeLevel
    );

    // Step 2: Find or create away club
    const awayClubId = await findOrCreateClub(
      row.AwayTeam,
      country,
      awayLevel
    );

    // Step 3: Upsert fixture using fixtures module's public API
    await upsertFixture({
      homeClubId,
      awayClubId,
      matchDate,
      country,
      competition,
      homeLevel,
      awayLevel,
      homeElo,
      awayElo,
      homeWinProb,
      drawProb,
      awayWinProb,
      source: "clubelo",
    });
  });
}

/**
 * Import fixtures from ClubElo API
 *
 * @param rows - Array of fixture rows from ClubElo API
 * @returns Statistics about the import
 */
export async function importFixtures(
  rows: ClubEloFixtureRow[]
): Promise<{ success: number; errors: number }> {
  logger.info(`Importing ${rows.length} fixtures from ClubElo`);

  if (rows.length === 0) {
    logger.warn("No fixtures returned from ClubElo API");
    return { success: 0, errors: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    try {
      await importSingleFixture(row);
      successCount++;

      // Log progress every 10 fixtures
      if (successCount % 10 === 0) {
        logger.debug(`Processed ${successCount}/${rows.length} fixtures`);
      }
    } catch (error) {
      errorCount++;
      logger.error(
        `Failed to import fixture: ${row.HomeTeam} vs ${row.AwayTeam}`,
        { error: (error as Error).message }
      );
    }
  }

  logger.info("Fixtures import complete", {
    success: successCount,
    errors: errorCount,
  });

  return { success: successCount, errors: errorCount };
}
