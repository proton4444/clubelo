/**
 * Rankings Service Tests
 *
 * Unit tests for the business logic layer.
 * We mock the repository to test service orchestration.
 */

import * as rankingsService from "../rankings.service";
import * as rankingsRepo from "../rankings.repository";
import { ApiError } from "../../../shared/middleware/error-handler";

// Mock the repository module
jest.mock("../rankings.repository");

const mockRepo = rankingsRepo as jest.Mocked<typeof rankingsRepo>;

describe("Rankings Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRankings", () => {
    it("should use provided date when specified", async () => {
      mockRepo.countRankings.mockResolvedValueOnce(100);
      mockRepo.findRankings.mockResolvedValueOnce([
        {
          id: 1,
          apiName: "ManCity",
          displayName: "Manchester City",
          country: "ENG",
          level: 1,
          rank: 1,
          elo: 1997.5,
        },
      ]);

      const result = await rankingsService.getRankings({
        date: "2024-11-20",
        pagination: { page: 1, pageSize: 10 },
      });

      expect(result.date).toBe("2024-11-20");
      expect(mockRepo.getLatestRatingsDate).not.toHaveBeenCalled();
      expect(mockRepo.countRankings).toHaveBeenCalledWith(
        "2024-11-20",
        undefined,
        undefined,
        undefined
      );
    });

    it("should fetch latest date when not specified", async () => {
      mockRepo.getLatestRatingsDate.mockResolvedValueOnce("2024-11-21");
      mockRepo.countRankings.mockResolvedValueOnce(100);
      mockRepo.findRankings.mockResolvedValueOnce([]);

      const result = await rankingsService.getRankings({
        pagination: { page: 1, pageSize: 10 },
      });

      expect(result.date).toBe("2024-11-21");
      expect(mockRepo.getLatestRatingsDate).toHaveBeenCalled();
    });

    it("should throw error when no data available", async () => {
      mockRepo.getLatestRatingsDate.mockResolvedValueOnce(null);

      await expect(
        rankingsService.getRankings({
          pagination: { page: 1, pageSize: 10 },
        })
      ).rejects.toThrow(ApiError);

      await expect(
        rankingsService.getRankings({
          pagination: { page: 1, pageSize: 10 },
        })
      ).rejects.toThrow("No rating data available");
    });

    it("should calculate pagination metadata correctly", async () => {
      mockRepo.getLatestRatingsDate.mockResolvedValueOnce("2024-11-20");
      mockRepo.countRankings.mockResolvedValueOnce(250); // Total results
      mockRepo.findRankings.mockResolvedValueOnce([]);

      const result = await rankingsService.getRankings({
        pagination: { page: 3, pageSize: 50 }, // Page 3, 50 per page
      });

      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 50,
        total: 250,
        totalPages: 5, // 250 / 50 = 5
      });

      // Check offset calculation
      expect(mockRepo.findRankings).toHaveBeenCalledWith(
        "2024-11-20",
        expect.objectContaining({
          offset: 100, // (page 3 - 1) * 50 = 100
          limit: 50,
        })
      );
    });

    it("should pass all filters to repository", async () => {
      mockRepo.getLatestRatingsDate.mockResolvedValueOnce("2024-11-20");
      mockRepo.countRankings.mockResolvedValueOnce(10);
      mockRepo.findRankings.mockResolvedValueOnce([]);

      await rankingsService.getRankings({
        country: "ESP",
        level: 1,
        minElo: 1800,
        pagination: { page: 1, pageSize: 20 },
      });

      expect(mockRepo.countRankings).toHaveBeenCalledWith(
        "2024-11-20",
        "ESP",
        1,
        1800
      );

      expect(mockRepo.findRankings).toHaveBeenCalledWith("2024-11-20", {
        country: "ESP",
        level: 1,
        minElo: 1800,
        limit: 20,
        offset: 0,
      });
    });

    it("should return clubs and filters in response", async () => {
      const mockClubs = [
        {
          id: 1,
          apiName: "Barcelona",
          displayName: "FC Barcelona",
          country: "ESP",
          level: 1,
          rank: 1,
          elo: 1950,
        },
      ];

      mockRepo.getLatestRatingsDate.mockResolvedValueOnce("2024-11-20");
      mockRepo.countRankings.mockResolvedValueOnce(1);
      mockRepo.findRankings.mockResolvedValueOnce(mockClubs);

      const result = await rankingsService.getRankings({
        country: "ESP",
        level: 1,
        minElo: 1900,
        pagination: { page: 1, pageSize: 10 },
      });

      expect(result).toEqual({
        date: "2024-11-20",
        country: "ESP",
        level: 1,
        minElo: 1900,
        clubs: mockClubs,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("should handle optional filters as null in response", async () => {
      mockRepo.getLatestRatingsDate.mockResolvedValueOnce("2024-11-20");
      mockRepo.countRankings.mockResolvedValueOnce(100);
      mockRepo.findRankings.mockResolvedValueOnce([]);

      const result = await rankingsService.getRankings({
        pagination: { page: 1, pageSize: 10 },
      });

      expect(result.country).toBeNull();
      expect(result.level).toBeNull();
      expect(result.minElo).toBeNull();
    });
  });
});
