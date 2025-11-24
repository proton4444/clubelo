/**
 * Rankings Module - Public API
 *
 * This is a BARREL FILE - it controls what the module exposes.
 * Other modules can ONLY import from this file, not from internal files.
 *
 * RULE: Only export what other modules need. Keep internals private.
 */

// Export routes (for server.ts to mount)
export { default as rankingsRoutes } from "./rankings.routes";

// Export types (for other modules to use)
export type {
  ClubRanking,
  RankingsFilters,
  RankingsResponse,
} from "./rankings.types";

// Export service (for scripts or other modules that need programmatic access)
export * as rankingsService from "./rankings.service";

// NOTE: We do NOT export the repository.
// Repository is an internal implementation detail.
