/**
 * Clubs Service
 *
 * BUSINESS LOGIC LAYER - Orchestrates operations for clubs domain.
 *
 * RULE: No SQL here - only business logic and orchestration.
 */

import * as clubsRepo from "./clubs.repository";
import {
  Club,
  ClubSearchFilters,
  ClubListResponse,
  ClubHistoryResponse,
} from "./clubs.types";
import { ApiError } from "../../shared/middleware/error-handler";
import { logger } from "../../shared/utils/logger";

/**
 * Get a club by ID or API name
 *
 * @param identifier - Club ID (number) or API name (string)
 * @returns Club if found
 * @throws ApiError if club not found
 */
export async function getClub(identifier: number | string): Promise<Club> {
  logger.debug("Fetching club", { identifier });

  let club: Club | null;

  if (typeof identifier === "number") {
    club = await clubsRepo.findClubById(identifier);
  } else {
    // Try parsing as number first
    const id = parseInt(identifier, 10);
    if (!isNaN(id)) {
      club = await clubsRepo.findClubById(id);
    } else {
      club = await clubsRepo.findClubByApiName(identifier);
    }
  }

  if (!club) {
    throw new ApiError(404, "Club not found");
  }

  return club;
}

/**
 * Search/list clubs with filters
 *
 * @param filters - Search and filter options
 * @returns List of clubs matching filters
 */
export async function searchClubs(
  filters: ClubSearchFilters
): Promise<ClubListResponse> {
  const limit = filters.limit || 100;

  logger.debug("Searching clubs", { filters });

  const clubs = await clubsRepo.searchClubs({
    query: filters.query,
    country: filters.country,
    level: filters.level,
    limit,
  });

  return { clubs };
}

/**
 * Get Elo rating history for a club
 *
 * @param identifier - Club ID or API name
 * @param from - Start date (YYYY-MM-DD), optional
 * @param to - End date (YYYY-MM-DD), optional
 * @returns Club info and history
 */
export async function getClubHistory(
  identifier: number | string,
  from?: string,
  to?: string
): Promise<ClubHistoryResponse> {
  // First, get the club
  const club = await getClub(identifier);

  logger.debug("Fetching club history", {
    clubId: club.id,
    from,
    to,
  });

  // Then get its history
  const history = await clubsRepo.getClubHistory(club.id, { from, to });

  return {
    club,
    history,
  };
}
