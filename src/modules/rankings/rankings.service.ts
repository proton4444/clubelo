/**
 * Rankings Service
 *
 * BUSINESS LOGIC LAYER - Orchestrates operations for rankings domain.
 * This layer coordinates repositories and implements business rules.
 *
 * RULE: No SQL here - only business logic and orchestration.
 */

import * as rankingsRepo from "./rankings.repository";
import { RankingsFilters, RankingsResponse } from "./rankings.types";
import { ApiError } from "../../shared/middleware/error-handler";
import { logger } from "../../shared/utils/logger";

/**
 * Get club rankings for a specific date (or latest available)
 *
 * @param filters - Filtering and pagination options
 * @returns Rankings response with clubs and pagination metadata
 */
export async function getRankings(
  filters: RankingsFilters
): Promise<RankingsResponse> {
  // Determine target date
  let targetDate: string;

  if (filters.date) {
    targetDate = filters.date;
  } else {
    // Find latest available date
    const latestDate = await rankingsRepo.getLatestRatingsDate();

    if (!latestDate) {
      throw new ApiError(404, "No rating data available");
    }

    targetDate = latestDate;
  }

  logger.debug("Fetching rankings", {
    date: targetDate,
    country: filters.country,
    level: filters.level,
    page: filters.pagination.page,
  });

  // Calculate pagination
  const { page, pageSize } = filters.pagination;
  const offset = (page - 1) * pageSize;

  // Count total results (for pagination metadata)
  const totalResults = await rankingsRepo.countRankings(
    targetDate,
    filters.country,
    filters.level,
    filters.minElo
  );

  // Fetch rankings
  const clubs = await rankingsRepo.findRankings(targetDate, {
    country: filters.country,
    level: filters.level,
    minElo: filters.minElo,
    limit: pageSize,
    offset,
  });

  // Build response
  const totalPages = Math.ceil(totalResults / pageSize);

  return {
    date: targetDate,
    country: filters.country || null,
    level: filters.level ?? null,
    minElo: filters.minElo ?? null,
    clubs,
    pagination: {
      page,
      pageSize,
      total: totalResults,
      totalPages,
    },
  };
}
