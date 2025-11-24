/**
 * Rankings Repository
 *
 * DATA ACCESS LAYER - This is the ONLY place that knows about SQL for rankings.
 * All database queries for rankings are isolated here.
 *
 * RULE: No business logic here - only database operations.
 */

import { db } from "../../shared/database/connection";
import { formatDateOnly } from "../../shared/utils/date-formatter";
import { EloRatingRow, ClubRanking } from "./rankings.types";

/**
 * Get the latest date we have ratings data for
 */
export async function getLatestRatingsDate(): Promise<string | null> {
  const result = await db.query<{ max_date: string }>(
    "SELECT MAX(date)::text as max_date FROM elo_ratings"
  );

  return result.rows[0]?.max_date || null;
}

/**
 * Count total rankings matching filters
 */
export async function countRankings(
  date: string,
  country?: string,
  level?: number,
  minElo?: number
): Promise<number> {
  const whereClauses = ["e.date = $1"];
  const params: any[] = [date];

  if (country) {
    whereClauses.push(`e.country = $${params.length + 1}`);
    params.push(country);
  }

  if (level !== undefined) {
    whereClauses.push(`e.level = $${params.length + 1}`);
    params.push(level);
  }

  if (minElo !== undefined) {
    whereClauses.push(`e.elo >= $${params.length + 1}`);
    params.push(minElo);
  }

  const query = `
    SELECT COUNT(*) as total
    FROM elo_ratings e
    WHERE ${whereClauses.join(" AND ")}
  `;

  const result = await db.query<{ total: string }>(query, params);
  return parseInt(result.rows[0].total, 10);
}

/**
 * Find rankings with filters and pagination
 */
export async function findRankings(
  date: string,
  options: {
    country?: string;
    level?: number;
    minElo?: number;
    limit: number;
    offset: number;
  }
): Promise<ClubRanking[]> {
  const whereClauses = ["e.date = $1"];
  const params: any[] = [date];

  if (options.country) {
    whereClauses.push(`e.country = $${params.length + 1}`);
    params.push(options.country);
  }

  if (options.level !== undefined) {
    whereClauses.push(`e.level = $${params.length + 1}`);
    params.push(options.level);
  }

  if (options.minElo !== undefined) {
    whereClauses.push(`e.elo >= $${params.length + 1}`);
    params.push(options.minElo);
  }

  const query = `
    SELECT
      c.id, c.api_name, c.display_name, c.country, c.level,
      e.rank, e.elo
    FROM elo_ratings e
    JOIN clubs c ON e.club_id = c.id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY e.elo DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  params.push(options.limit, options.offset);

  const result = await db.query<EloRatingRow>(query, params);

  // Transform database rows to DTOs
  return result.rows.map(mapRowToClubRanking);
}

/**
 * Map database row to ClubRanking DTO
 *
 * This is the ONLY place we transform database schema to public API.
 */
function mapRowToClubRanking(row: EloRatingRow): ClubRanking {
  return {
    id: row.id,
    apiName: row.api_name,
    displayName: row.display_name,
    country: row.country,
    level: row.level,
    rank: row.rank,
    elo: parseFloat(row.elo), // Postgres DECIMAL comes as string
  };
}
