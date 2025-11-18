#!/usr/bin/env tsx

/**
 * Import daily snapshot of club ratings
 *
 * This script fetches all club ratings for a specific date from the ClubElo API
 * and imports them into the database.
 *
 * Usage:
 *   npm run import:clubelo -- --date=2025-11-18
 *   tsx src/scripts/import-daily.ts --date=2025-11-18
 *
 * The script will:
 * 1. Fetch CSV data from http://api.clubelo.com/YYYY-MM-DD
 * 2. Create or update club records
 * 3. Create or update Elo ratings for that date
 *
 * It's safe to run multiple times - it will just update existing data.
 */

import { fetchDailySnapshot } from '../lib/clubelo-api';
import { importDailySnapshot } from '../lib/importer';
import { db } from '../lib/db';

/**
 * Parse command-line arguments
 */
function parseArgs(): { date: string } {
  const args = process.argv.slice(2);
  let date = '';

  for (const arg of args) {
    if (arg.startsWith('--date=')) {
      date = arg.substring('--date='.length);
    }
  }

  // Default to yesterday if no date provided
  if (!date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
    console.log(`No date provided, defaulting to yesterday: ${date}`);
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Error: Date must be in YYYY-MM-DD format');
    console.error('Usage: npm run import:clubelo -- --date=2025-11-18');
    process.exit(1);
  }

  return { date };
}

/**
 * Main function
 */
async function main() {
  console.log('=== ClubElo Daily Snapshot Importer ===\n');

  const { date } = parseArgs();

  try {
    // Step 1: Fetch data from ClubElo API
    console.log(`Fetching snapshot for ${date}...`);
    const rows = await fetchDailySnapshot(date);

    if (rows.length === 0) {
      console.warn('Warning: No data returned from API');
      return;
    }

    // Step 2: Import into database
    const snapshotDate = new Date(date);
    await importDailySnapshot(rows, snapshotDate);

    // Step 3: Show summary
    console.log('\n=== Summary ===');
    const clubCountResult = await db.query('SELECT COUNT(*) FROM clubs');
    const ratingCountResult = await db.query('SELECT COUNT(*) FROM elo_ratings');
    console.log(`Total clubs in database: ${clubCountResult.rows[0].count}`);
    console.log(`Total ratings in database: ${ratingCountResult.rows[0].count}`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run the script
main();
