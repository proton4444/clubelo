/**
 * Rankings Repository Tests
 *
 * Unit tests for the data access layer.
 * We mock the database to test SQL query construction and data transformation.
 */

import * as rankingsRepo from "../rankings.repository";
import { db } from "../../../shared/database/connection";

// Mock the database module
jest.mock("../../../shared/database/connection");

const mockDb = db as jest.Mocked<typeof db>;

describe("Rankings Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLatestRatingsDate", () => {
    it("should return the latest date when data exists", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ max_date: "2024-11-20" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.getLatestRatingsDate();

      expect(result).toBe("2024-11-20");
      expect(mockDb.query).toHaveBeenCalledWith(
        "SELECT MAX(date)::text as max_date FROM elo_ratings"
      );
    });

    it("should return null when no data exists", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ max_date: null }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.getLatestRatingsDate();

      expect(result).toBeNull();
    });
  });

  describe("countRankings", () => {
    it("should count all rankings for a date without filters", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: "150" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.countRankings("2024-11-20");

      expect(result).toBe(150);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT COUNT(*) as total"),
        ["2024-11-20"]
      );
    });

    it("should count rankings with country filter", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: "42" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.countRankings("2024-11-20", "ENG");

      expect(result).toBe(42);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.country = $2"),
        ["2024-11-20", "ENG"]
      );
    });

    it("should count rankings with level filter", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: "20" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.countRankings(
        "2024-11-20",
        undefined,
        1
      );

      expect(result).toBe(20);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.level = $2"),
        ["2024-11-20", 1]
      );
    });

    it("should count rankings with minElo filter", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: "10" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.countRankings(
        "2024-11-20",
        undefined,
        undefined,
        1900
      );

      expect(result).toBe(10);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.elo >= $2"),
        ["2024-11-20", 1900]
      );
    });

    it("should count rankings with all filters combined", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total: "5" }],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.countRankings(
        "2024-11-20",
        "ENG",
        1,
        1900
      );

      expect(result).toBe(5);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.country = $2"),
        ["2024-11-20", "ENG", 1, 1900]
      );
    });
  });

  describe("findRankings", () => {
    it("should find rankings with pagination", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            api_name: "ManCity",
            display_name: "Manchester City",
            country: "ENG",
            level: 1,
            rank: 1,
            elo: "1997.5",
          },
          {
            id: 2,
            api_name: "Liverpool",
            display_name: "Liverpool",
            country: "ENG",
            level: 1,
            rank: 2,
            elo: "1972.1",
          },
        ],
        rowCount: 2,
      } as any);

      const result = await rankingsRepo.findRankings("2024-11-20", {
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        apiName: "ManCity",
        displayName: "Manchester City",
        country: "ENG",
        level: 1,
        rank: 1,
        elo: 1997.5, // Converted from string
      });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY e.elo DESC"),
        ["2024-11-20", 10, 0]
      );
    });

    it("should apply country filter in WHERE clause", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      await rankingsRepo.findRankings("2024-11-20", {
        country: "ESP",
        limit: 10,
        offset: 0,
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.country = $2"),
        ["2024-11-20", "ESP", 10, 0]
      );
    });

    it("should handle NULL rank values", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            api_name: "SmallClub",
            display_name: "Small Club",
            country: "ENG",
            level: 5,
            rank: null,
            elo: "1234.5",
          },
        ],
        rowCount: 1,
      } as any);

      const result = await rankingsRepo.findRankings("2024-11-20", {
        limit: 10,
        offset: 0,
      });

      expect(result[0].rank).toBeNull();
    });
  });
});
