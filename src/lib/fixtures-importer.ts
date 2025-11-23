import { db } from './db';
import { fetchFixtures } from './clubelo-api';

/**
 * Find or create a club by name
 * Returns the club ID
 */
async function findOrCreateClub(clubName: string, country: string, level: number): Promise<number> {
    const apiName = clubName.trim();
    const displayName = clubName.trim();

    // Try to find existing club
    const existingClub = await db.query(
        'SELECT id FROM clubs WHERE api_name = $1',
        [apiName]
    );

    if (existingClub.rows.length > 0) {
        return existingClub.rows[0].id;
    }

    // Create new club if it doesn't exist
    const newClub = await db.query(
        `INSERT INTO clubs (api_name, display_name, country, level, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
        [apiName, displayName, country, level]
    );

    console.log(`  Created new club: ${displayName} (${country})`);
    return newClub.rows[0].id;
}

/**
 * Import fixtures from ClubElo API
 */
export async function importFixtures(date?: string): Promise<{ success: number; errors: number }> {
    console.log('=== ClubElo Fixtures Importer ===\n');

    if (date) {
        console.log(`Fetching fixtures for ${date}...`);
    } else {
        console.log('Fetching upcoming fixtures...');
    }

    try {
        // Step 1: Fetch fixtures from ClubElo API
        const rows = await fetchFixtures(date);

        if (rows.length === 0) {
            console.warn('Warning: No fixtures returned from API');
            return { success: 0, errors: 0 };
        }

        console.log(`\nImporting ${rows.length} fixtures...\n`);

        let successCount = 0;
        let errorCount = 0;

        // Step 2: Process each fixture
        for (const row of rows) {
            try {
                // Parse fixture data
                const matchDate = new Date(row.Date);
                const country = row.Country.trim();
                const competition = row.Competition?.trim() || '';
                const homeLevel = parseInt(row.HomeLevel, 10);
                const awayLevel = parseInt(row.AwayLevel, 10);
                const homeElo = parseFloat(row.HomeElo);
                const awayElo = parseFloat(row.AwayElo);
                const homeWinProb = parseFloat(row.HomeProbW);
                const drawProb = parseFloat(row.ProbD);
                const awayWinProb = parseFloat(row.AwayProbW);

                // Validate parsed values
                if (isNaN(homeElo) || isNaN(awayElo)) {
                    console.warn(`Skipping invalid fixture: ${row.HomeTeam} vs ${row.AwayTeam} - invalid Elo values`);
                    errorCount++;
                    continue;
                }

                // Step 3: Find or create clubs
                const homeClubId = await findOrCreateClub(row.HomeTeam, country, homeLevel);
                const awayClubId = await findOrCreateClub(row.AwayTeam, country, awayLevel);

                // Step 4: Upsert fixture
                await db.query(
                    `INSERT INTO fixtures (
            home_club_id, away_club_id, match_date, country, competition,
            home_level, away_level, home_elo, away_elo,
            home_win_prob, draw_prob, away_win_prob,
            source, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          ON CONFLICT (home_club_id, away_club_id, match_date)
          DO UPDATE SET
            country = EXCLUDED.country,
            competition = EXCLUDED.competition,
            home_level = EXCLUDED.home_level,
            away_level = EXCLUDED.away_level,
            home_elo = EXCLUDED.home_elo,
            away_elo = EXCLUDED.away_elo,
            home_win_prob = EXCLUDED.home_win_prob,
            draw_prob = EXCLUDED.draw_prob,
            away_win_prob = EXCLUDED.away_win_prob,
            updated_at = NOW()`,
                    [
                        homeClubId, awayClubId, matchDate, country, competition,
                        homeLevel, awayLevel, homeElo, awayElo,
                        homeWinProb, drawProb, awayWinProb,
                        'clubelo'
                    ]
                );

                successCount++;

                // Log progress every 10 fixtures
                if (successCount % 10 === 0) {
                    console.log(`  Processed ${successCount}/${rows.length} fixtures...`);
                }

            } catch (error) {
                errorCount++;
                console.error(`  Failed to import fixture ${row.HomeTeam} vs ${row.AwayTeam}:`, error);
            }
        }

        console.log(`\n✓ Import complete: ${successCount} successful, ${errorCount} errors`);
        return { success: successCount, errors: errorCount };

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        throw error;
    }
}
