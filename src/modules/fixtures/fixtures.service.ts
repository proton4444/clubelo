/**
 * Fixtures Service
 *
 * BUSINESS LOGIC LAYER - Orchestrates operations for fixtures domain.
 *
 * RULE: No SQL here - only business logic and orchestration.
 */

import * as fixturesRepo from "./fixtures.repository";
import { FixtureFilters, FixturesResponse } from "./fixtures.types";
import { logger } from "../../shared/utils/logger";

/**
 * Get fixtures with filters
 *
 * @param filters - Search and filter options
 * @returns Fixtures matching the filters
 */
export async function getFixtures(
  filters: FixtureFilters
): Promise<FixturesResponse> {
  const limit = filters.limit || 100;

  logger.debug("Fetching fixtures", {
    date: filters.date,
    dateRange: filters.dateRange,
    country: filters.country,
    competition: filters.competition,
  });

  const fixtures = await fixturesRepo.searchFixtures({
    date: filters.date,
    fromDate: filters.dateRange?.from,
    toDate: filters.dateRange?.to,
    country: filters.country,
    competition: filters.competition,
    limit,
  });

  return { fixtures };
}
