/**
 * External Data Module - Public API
 *
 * BARREL FILE - Controls what this module exposes.
 *
 * This module handles all external data sources (ClubElo API).
 */

// Export routes (for server.ts to mount)
export { default as cronRoutes } from "./cron.routes";

// Export services (for scripts)
export * as clubeloClient from "./clubelo-client";
export * as dataImporter from "./data-importer.service";
export * as fixturesImporter from "./fixtures-importer.service";

// Export types (for other modules)
export type { ClubEloRow, ClubEloFixtureRow } from "./clubelo-client";
