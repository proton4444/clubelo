#!/usr/bin/env tsx

/**
 * Import fixtures (upcoming matches) with predictions
 *
 * This script fetches upcoming match fixtures from the ClubElo API
 * with Elo-based win/draw/loss probabilities.
 *
 * Usage:
 *   npm run import:fixtures
 *   npm run import:fixtures -- --date=2025-11-20
 *   tsx src/scripts/import-fixtures.ts --date=2025-11-20
 */

import { importFixtures } from '../lib/fixtures-importer';
import { db } from '../lib/db';

/**
 * Parse command-line arguments
 */
function parseArgs(): { date?: string } {
  const args = process.argv.slice(2);
  let date: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--date=')) {
      date = arg.substring('--date='.length);
    }
  }

  // Validate date format if provided
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Error: Date must be in YYYY-MM-DD format');
    console.error('Usage: npm run import:fixtures -- --date=2025-11-20');
    process.exit(1);
  }

  return { date };
}

// Run the script
async function main() {
  const { date } = parseArgs();

  try {
    await importFixtures(date);

    // Show summary
    console.log('\n=== Summary ===');
    const fixtureCountResult = await db.query('SELECT COUNT(*) FROM fixtures');
    console.log(`Total fixtures in database: ${fixtureCountResult.rows[0].count}`);

  } catch (error) {
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();

