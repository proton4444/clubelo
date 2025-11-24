/**
 * Fixtures Repository
 *
 * DATA ACCESS LAYER - All SQL queries for fixtures are isolated here.
 *
 * RULE: No business logic here - only database operations.
 */

import { db } from "../../shared/database/connection";
import { formatDateOnly } from "../../shared/utils/date-formatter";
import { Fixture, FixtureRow } from "./fixtures.types";

/**
 * Search fixtures with filters
 */
export async function searchFixtures(options: {
  date?: string;
  fromDate?: string;
  toDate?: string;
  country?: string;
  competition?: string;
  limit: number;
}): Promise<Fixture[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  // Handle date filtering
  if (options.date) {
    whereClauses.push(`f.match_date = $${params.length + 1}`);
    params.push(options.date);
  } else {
    if (options.fromDate) {
      whereClauses.push(`f.match_date >= $${params.length + 1}`);
      params.push(options.fromDate);
    }
    if (options.toDate) {
      whereClauses.push(`f.match_date <= $${params.length + 1}`);
      params.push(options.toDate);
    }
  }

  if (options.country) {
    whereClauses.push(`f.country = $${params.length + 1}`);
    params.push(options.country);
  }

  if (options.competition) {
    whereClauses.push(`f.competition ILIKE $${params.length + 1}`);
    params.push(`%${options.competition}%`);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const query = `
    SELECT
      f.id, f.match_date, f.country, f.competition,
      f.home_elo, f.away_elo,
      f.home_win_prob, f.draw_prob, f.away_win_prob,
      hc.id as home_club_id, hc.display_name as home_club_name,
      hc.country as home_club_country,
      ac.id as away_club_id, ac.display_name as away_club_name,
      ac.country as away_club_country
    FROM fixtures f
    JOIN clubs hc ON f.home_club_id = hc.id
    JOIN clubs ac ON f.away_club_id = ac.id
    ${whereClause}
    ORDER BY f.match_date ASC, f.id ASC
    LIMIT $${params.length + 1}
  `;
  params.push(options.limit);

  const result = await db.query<FixtureRow>(query, params);
  return result.rows.map(mapRowToFixture);
}

/**
 * Upsert a fixture (insert or update if exists)
 *
 * Used by data import operations.
 */
export async function upsertFixture(fixture: {
  homeClubId: number;
  awayClubId: number;
  matchDate: string;
  country: string;
  competition: string;
  homeLevel: number;
  awayLevel: number;
  homeElo: number;
  awayElo: number;
  homeWinProb?: number;
  drawProb?: number;
  awayWinProb?: number;
  source: string;
}): Promise<void> {
  const query = `
    INSERT INTO fixtures (
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
      source = EXCLUDED.source,
      updated_at = NOW()
  `;

  await db.query(query, [
    fixture.homeClubId,
    fixture.awayClubId,
    fixture.matchDate,
    fixture.country,
    fixture.competition,
    fixture.homeLevel,
    fixture.awayLevel,
    fixture.homeElo,
    fixture.awayElo,
    fixture.homeWinProb ?? null,
    fixture.drawProb ?? null,
    fixture.awayWinProb ?? null,
    fixture.source,
  ]);
}

/**
 * Map database row to Fixture DTO
 */
function mapRowToFixture(row: FixtureRow): Fixture {
  return {
    id: row.id,
    matchDate: formatDateOnly(row.match_date)!,
    homeTeam: {
      id: row.home_club_id,
      name: row.home_club_name,
      country: row.home_club_country,
      elo: parseFloat(row.home_elo),
    },
    awayTeam: {
      id: row.away_club_id,
      name: row.away_club_name,
      country: row.away_club_country,
      elo: parseFloat(row.away_elo),
    },
    country: row.country,
    competition: row.competition,
    predictions: {
      homeWin: row.home_win_prob !== null ? parseFloat(row.home_win_prob) : null,
      draw: row.draw_prob !== null ? parseFloat(row.draw_prob) : null,
      awayWin: row.away_win_prob !== null ? parseFloat(row.away_win_prob) : null,
    },
  };
}
