/**
 * Rankings Module - Type Definitions
 *
 * DTOs for the Rankings domain. PUBLIC CONTRACT ONLY.
 */

import { PaginationParams, PaginationMeta } from "../../shared/types/common.types";

/**
 * Club ranking (Public DTO)
 */
export interface ClubRanking {
  id: number;
  apiName: string;
  displayName: string;
  country: string;
  level: number;
  rank: number | null;
  elo: number;
}

/**
 * Rankings request filters
 */
export interface RankingsFilters {
  date?: string;        // YYYY-MM-DD (defaults to latest)
  country?: string;     // Country code filter
  level?: number;       // League level filter
  minElo?: number;      // Minimum Elo rating
  pagination: PaginationParams;
}

/**
 * Rankings response
 */
export interface RankingsResponse {
  date: string;
  country: string | null;
  level: number | null;
  minElo: number | null;
  clubs: ClubRanking[];
  pagination: PaginationMeta;
}

/**
 * Internal database row (NOT exported from index.ts)
 */
export interface EloRatingRow {
  id: number;
  api_name: string;
  display_name: string;
  country: string;
  level: number;
  rank: number | null;
  elo: string; // Postgres returns DECIMAL as string
}
