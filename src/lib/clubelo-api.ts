/**
 * ClubElo API client
 *
 * Handles fetching data from the ClubElo public CSV API with proper
 * error handling, timeouts, and retries.
 */

import { parse } from 'csv-parse/sync';
import { config } from './config';

/**
 * Raw row from ClubElo CSV API
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
 * Fetch CSV data from a URL with retry logic
 */
async function fetchWithRetry(url: string, maxRetries = config.httpMaxRetries): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching ${url} (attempt ${attempt}/${maxRetries})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.httpTimeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`Successfully fetched ${text.length} bytes`);
      return text;

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      // Don't retry on abort (timeout) or 4xx errors
      if (error instanceof Error && (error.name === 'AbortError' ||
          (error.message.includes('HTTP 4')))) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastError || new Error('Failed to fetch data');
}

/**
 * Parse ClubElo CSV data into structured objects
 */
function parseClubEloCsv(csvText: string): ClubEloRow[] {
  try {
    // Parse CSV with header row
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as ClubEloRow[];

    console.log(`Parsed ${records.length} rows from CSV`);
    return records;

  } catch (error) {
    console.error('CSV parsing error:', error);
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
    throw new Error('Date must be in YYYY-MM-DD format');
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
  if (!clubName || clubName.trim() === '') {
    throw new Error('Club name is required');
  }

  const url = `${config.clubeloApiBase}/${encodeURIComponent(clubName)}`;
  const csvText = await fetchWithRetry(url);
  return parseClubEloCsv(csvText);
}
