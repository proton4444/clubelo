#!/usr/bin/env tsx

/**
 * Import full Elo history for a single club
 *
 * This script fetches the complete rating history for one club from the ClubElo API
 * and imports all of it into the database.
 *
 * Usage:
 *   npm run import:clubelo:club -- --club="ManCity"
 *   tsx src/scripts/import-club.ts --club="Liverpool"
 *
 * The script will:
 * 1. Fetch CSV data from http://api.clubelo.com/<ClubName>
 * 2. Create or update the club record
 * 3. Create or update all historical Elo ratings for that club
 *
 * It's safe to run multiple times - it will just update existing data.
 *
 * Use this for:
 * - Backfilling complete history for specific clubs
 * - Testing the import system
 * - Getting detailed historical data before you have daily snapshots
 */

import { fetchClubHistory } from '../lib/clubelo-api';
import { importClubHistory } from '../lib/importer';
import { prisma } from '../lib/db';

/**
 * Parse command-line arguments
 */
function parseArgs(): { club: string } {
  const args = process.argv.slice(2);
  let club = '';

  for (const arg of args) {
    if (arg.startsWith('--club=')) {
      club = arg.substring('--club='.length);
    }
  }

  if (!club) {
    console.error('Error: Club name is required');
    console.error('Usage: npm run import:clubelo:club -- --club="ManCity"');
    console.error('\nExamples:');
    console.error('  --club="ManCity"');
    console.error('  --club="Liverpool"');
    console.error('  --club="RealMadrid"');
    process.exit(1);
  }

  return { club };
}

/**
 * Main function
 */
async function main() {
  console.log('=== ClubElo Club History Importer ===\n');

  const { club } = parseArgs();

  try {
    // Step 1: Fetch data from ClubElo API
    console.log(`Fetching full history for "${club}"...`);
    const rows = await fetchClubHistory(club);

    if (rows.length === 0) {
      console.warn('Warning: No data returned from API');
      console.warn('Make sure the club name is correct (case-sensitive)');
      return;
    }

    // Step 2: Import into database
    await importClubHistory(rows, club);

    // Step 3: Show summary for this club
    console.log('\n=== Summary ===');
    const clubRecord = await prisma.club.findUnique({
      where: { apiName: club },
      include: {
        _count: {
          select: { eloRatings: true },
        },
      },
    });

    if (clubRecord) {
      console.log(`Club: ${clubRecord.displayName} (${clubRecord.country})`);
      console.log(`Historical ratings imported: ${clubRecord._count.eloRatings}`);
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
