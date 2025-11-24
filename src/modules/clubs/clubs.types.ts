/**
 * Clubs Module - Type Definitions
 *
 * DTOs for the Clubs domain. These are the PUBLIC CONTRACT.
 * No other module should know about database schema - only these DTOs.
 */

/**
 * Club entity (Public DTO)
 */
export interface Club {
  id: number;
  apiName: string;
  displayName: string;
  country: string;
  level: number;
}

/**
 * Club search filters
 */
export interface ClubSearchFilters {
  query?: string; // Search in display name
  country?: string; // Filter by country code
  level?: number; // Filter by league level
  limit?: number; // Max results
}

/**
 * Club list response
 */
export interface ClubListResponse {
  clubs: Club[];
}

/**
 * Club history entry
 */
export interface ClubHistoryEntry {
  date: string; // YYYY-MM-DD
  elo: number;
  rank: number | null;
}

/**
 * Club history response
 */
export interface ClubHistoryResponse {
  club: Club;
  history: ClubHistoryEntry[];
}

/**
 * Internal database row type (NOT exported from index.ts)
 * This stays private to the repository layer
 */
export interface ClubRow {
  id: number;
  api_name: string;
  display_name: string;
  country: string;
  level: number;
}
