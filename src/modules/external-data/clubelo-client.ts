/**
 * ClubElo API Client
 *
 * EXTERNAL DATA SOURCE - Handles fetching data from ClubElo public CSV API.
 * This is the ONLY place that knows about the ClubElo API structure.
 *
 * Moved from: src/lib/clubelo-api.ts
 */

import { parse } from "csv-parse/sync";
import { config } from "../../shared/config/environment";
import { logger } from "../../shared/utils/logger";

/**
 * Raw row from ClubElo CSV API (club ratings)
 */
export interface ClubEloRow {
  Rank: string;
  Club: string;
  Country: string;
  Level: string;
  Elo: string;
  From: string;
  To: string;
}

/**
 * Raw row from ClubElo fixtures CSV API
 */
export interface ClubEloFixtureRow {
  Date: string;
  HomeTeam: string;
  AwayTeam: string;
  Country: string;
  Competition: string;
  HomeLevel: string;
  AwayLevel: string;
  HomeElo: string;
  AwayElo: string;
  HomeProbW: string;
  ProbD: string;
  AwayProbW: string;
}

/**
 * Fetch CSV data from a URL with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  maxRetries = config.httpMaxRetries
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Fetching ${url} (attempt ${attempt}/${maxRetries})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        config.httpTimeout
      );

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      logger.info(`Successfully fetched ${text.length} bytes from ClubElo API`);
      return text;
    } catch (error) {
      lastError = error as Error;
      logger.error(`Attempt ${attempt} failed`, {
        url,
        error: (error as Error).message,
      });

      // Don't retry on abort (timeout) or 4xx errors
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("HTTP 4"))
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        logger.debug(`Waiting ${waitMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastError || new Error("Failed to fetch data from ClubElo API");
}

/**
 * Parse ClubElo CSV data into structured objects
 */
function parseClubEloCsv(csvText: string): ClubEloRow[] {
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ClubEloRow[];

    logger.debug(`Parsed ${records.length} rows from ClubElo CSV`);
    return records;
  } catch (error) {
    logger.error("CSV parsing error", { error: (error as Error).message });
    throw new Error(`Failed to parse CSV: ${error}`);
  }
}

/**
 * Fetch daily snapshot of all clubs on a specific date
 *
 * @param date - Date in YYYY-MM-DD format (e.g., "2025-11-18")
 * @returns Array of club rating rows for that date
 */
export async function fetchDailySnapshot(date: string): Promise<ClubEloRow[]> {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  const url = `${config.clubeloApiBase}/${date}`;
  const csvText = await fetchWithRetry(url);
  return parseClubEloCsv(csvText);
}

/**
 * Fetch full Elo history for a single club
 *
 * @param clubName - Club name as used in ClubElo API (e.g., "ManCity")
 * @returns Array of all historical rating rows for that club
 */
export async function fetchClubHistory(clubName: string): Promise<ClubEloRow[]> {
  if (!clubName || clubName.trim() === "") {
    throw new Error("Club name is required");
  }

  const url = `${config.clubeloApiBase}/${encodeURIComponent(clubName)}`;
  const csvText = await fetchWithRetry(url);
  return parseClubEloCsv(csvText);
}

/**
 * Fetch upcoming fixtures with predictions
 *
 * @param date - Optional date in YYYY-MM-DD format. If not provided, fetches all upcoming fixtures.
 * @returns Array of fixture rows with predictions
 */
export async function fetchFixtures(
  date?: string
): Promise<ClubEloFixtureRow[]> {
  let url = `${config.clubeloApiBase}/fixtures`;

  if (date) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("Date must be in YYYY-MM-DD format");
    }
    url = `${config.clubeloApiBase}/fixtures/${date}`;
  }

  const csvText = await fetchWithRetry(url);

  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ClubEloFixtureRow[];

    logger.debug(`Parsed ${records.length} fixtures from ClubElo CSV`);
    return records;
  } catch (error) {
    logger.error("Fixtures CSV parsing error", {
      error: (error as Error).message,
    });
    throw new Error(`Failed to parse fixtures CSV: ${error}`);
  }
}
