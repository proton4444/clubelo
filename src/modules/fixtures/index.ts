/**
 * Fixtures Module - Public API
 *
 * BARREL FILE - Controls what this module exposes.
 *
 * RULE: Only export what other modules need. Keep internals private.
 */

// Export routes (for server.ts to mount)
export { default as fixturesRoutes } from "./fixtures.routes";

// Export types (for other modules to use)
export type {
  Fixture,
  FixtureTeam,
  MatchPredictions,
  FixtureFilters,
  FixturesResponse,
} from "./fixtures.types";

// Export service (for programmatic access)
export * as fixturesService from "./fixtures.service";

// Export repository (ONLY for external-data module that needs to upsert fixtures)
export { upsertFixture } from "./fixtures.repository";
