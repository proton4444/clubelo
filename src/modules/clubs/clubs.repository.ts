/**
 * Clubs Repository
 *
 * DATA ACCESS LAYER - All SQL queries for clubs are isolated here.
 *
 * RULE: No business logic here - only database operations.
 */

import { db } from "../../shared/database/connection";
import { formatDateOnly } from "../../shared/utils/date-formatter";
import { Club, ClubRow } from "./clubs.types";

/**
 * Find a club by ID
 */
export async function findClubById(id: number): Promise<Club | null> {
  const query = "SELECT * FROM clubs WHERE id = $1";
  const result = await db.query<ClubRow>(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToClub(result.rows[0]);
}

/**
 * Find a club by API name
 */
export async function findClubByApiName(apiName: string): Promise<Club | null> {
  const query = "SELECT * FROM clubs WHERE api_name = $1";
  const result = await db.query<ClubRow>(query, [apiName]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToClub(result.rows[0]);
}

/**
 * Search clubs with filters
 */
export async function searchClubs(options: {
  query?: string;
  country?: string;
  level?: number;
  limit: number;
}): Promise<Club[]> {
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (options.query) {
    whereClauses.push(
      `LOWER(display_name) LIKE LOWER($${params.length + 1})`
    );
    params.push(`%${options.query}%`);
  }

  if (options.country) {
    whereClauses.push(`country = $${params.length + 1}`);
    params.push(options.country);
  }

  if (options.level !== undefined) {
    whereClauses.push(`level = $${params.length + 1}`);
    params.push(options.level);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const query = `
    SELECT id, api_name, display_name, country, level
    FROM clubs
    ${whereClause}
    ORDER BY display_name ASC
    LIMIT $${params.length + 1}
  `;
  params.push(options.limit);

  const result = await db.query<ClubRow>(query, params);
  return result.rows.map(mapRowToClub);
}

/**
 * Get club Elo rating history
 */
export async function getClubHistory(
  clubId: number,
  options: {
    from?: string;
    to?: string;
  }
): Promise<Array<{ date: string; elo: number; rank: number | null }>> {
  const whereClauses = ["club_id = $1"];
  const params: any[] = [clubId];

  if (options.from) {
    whereClauses.push(`date >= $${params.length + 1}`);
    params.push(options.from);
  }

  if (options.to) {
    whereClauses.push(`date <= $${params.length + 1}`);
    params.push(options.to);
  }

  const query = `
    SELECT date, elo, rank
    FROM elo_ratings
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY date ASC
  `;

  const result = await db.query<{
    date: Date;
    elo: string;
    rank: number | null;
  }>(query, params);

  return result.rows.map((row) => ({
    date: formatDateOnly(row.date)!,
    elo: parseFloat(row.elo),
    rank: row.rank,
  }));
}

/**
 * Upsert a club (insert or update if exists)
 *
 * Used by data import operations.
 */
export async function upsertClub(club: {
  apiName: string;
  displayName: string;
  country: string;
  level: number;
}): Promise<number> {
  const query = `
    INSERT INTO clubs (api_name, display_name, country, level)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (api_name)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      country = EXCLUDED.country,
      level = EXCLUDED.level
    RETURNING id
  `;

  const result = await db.query<{ id: number }>(query, [
    club.apiName,
    club.displayName,
    club.country,
    club.level,
  ]);

  return result.rows[0].id;
}

/**
 * Map database row to Club DTO
 */
function mapRowToClub(row: ClubRow): Club {
  return {
    id: row.id,
    apiName: row.api_name,
    displayName: row.display_name,
    country: row.country,
    level: row.level,
  };
}
