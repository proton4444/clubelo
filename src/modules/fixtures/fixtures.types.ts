/**
 * Fixtures Module - Type Definitions
 *
 * DTOs for match fixtures and predictions. PUBLIC CONTRACT ONLY.
 */

import { DateRangeFilter } from "../../shared/types/common.types";

/**
 * Team in a fixture (Public DTO)
 */
export interface FixtureTeam {
  id: number;
  name: string;
  country: string;
  elo: number;
}

/**
 * Match predictions based on Elo
 */
export interface MatchPredictions {
  homeWin: number | null;   // Probability (0-1)
  draw: number | null;      // Probability (0-1)
  awayWin: number | null;   // Probability (0-1)
}

/**
 * Fixture (Public DTO)
 */
export interface Fixture {
  id: number;
  matchDate: string;        // YYYY-MM-DD
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  country: string;
  competition: string;
  predictions: MatchPredictions;
}

/**
 * Fixture search filters
 */
export interface FixtureFilters {
  date?: string;            // Single date (YYYY-MM-DD)
  dateRange?: DateRangeFilter; // Date range
  country?: string;         // Country code
  competition?: string;     // Competition name (partial match)
  limit?: number;           // Max results
}

/**
 * Fixtures response
 */
export interface FixturesResponse {
  fixtures: Fixture[];
}

/**
 * Internal database row (NOT exported from index.ts)
 */
export interface FixtureRow {
  id: number;
  match_date: Date;
  country: string;
  competition: string;
  home_elo: string;
  away_elo: string;
  home_win_prob: string | null;
  draw_prob: string | null;
  away_win_prob: string | null;
  home_club_id: number;
  home_club_name: string;
  home_club_country: string;
  away_club_id: number;
  away_club_name: string;
  away_club_country: string;
}
