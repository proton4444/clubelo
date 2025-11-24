/**
 * Clubs Module - Public API
 *
 * BARREL FILE - Controls what this module exposes.
 *
 * RULE: Only export what other modules need. Keep internals private.
 */

// Export routes (for server.ts to mount)
export { default as clubsRoutes } from "./clubs.routes";

// Export types (for other modules to use)
export type {
  Club,
  ClubSearchFilters,
  ClubListResponse,
  ClubHistoryEntry,
  ClubHistoryResponse,
} from "./clubs.types";

// Export service (for programmatic access)
export * as clubsService from "./clubs.service";

// Export repository (ONLY for external-data module that needs to upsert clubs)
// This is an exception to show how to handle cross-module dependencies
export { upsertClub } from "./clubs.repository";
