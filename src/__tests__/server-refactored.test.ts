/**
 * Server Integration Tests
 *
 * End-to-end tests for the refactored API server.
 * Tests the full request/response cycle.
 */

import request from "supertest";
import app from "../server-refactored";
import { db } from "../shared/database/connection";

// Mock the database module
jest.mock("../shared/database/connection");

const mockDb = db as jest.Mocked<typeof db>;

describe("Server Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /api/elo/rankings", () => {
    it("should return rankings with default pagination", async () => {
      // Mock database queries
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ max_date: "2024-11-20" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ total: "150" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
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
          ],
          rowCount: 1,
        } as any);

      const response = await request(app).get("/api/elo/rankings");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("date", "2024-11-20");
      expect(response.body).toHaveProperty("clubs");
      expect(response.body.clubs).toHaveLength(1);
      expect(response.body.clubs[0]).toEqual({
        id: 1,
        apiName: "ManCity",
        displayName: "Manchester City",
        country: "ENG",
        level: 1,
        rank: 1,
        elo: 1997.5,
      });
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 100,
        total: 150,
        totalPages: 2,
      });
    });

    it("should filter by country", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ max_date: "2024-11-20" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ total: "20" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const response = await request(app)
        .get("/api/elo/rankings")
        .query({ country: "ESP" });

      expect(response.status).toBe(200);
      expect(response.body.country).toBe("ESP");
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("e.country = $2"),
        expect.any(Array)
      );
    });

    it("should handle pagination", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ max_date: "2024-11-20" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ total: "100" }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const response = await request(app)
        .get("/api/elo/rankings")
        .query({ page: 2, pageSize: 20 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        page: 2,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      });
      // Check offset calculation: (page 2 - 1) * 20 = 20
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT"),
        expect.arrayContaining([20, 20]) // limit, offset
      );
    });

    it("should return 400 for invalid pagination", async () => {
      const response = await request(app)
        .get("/api/elo/rankings")
        .query({ page: 0 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when no data available", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ max_date: null }],
        rowCount: 1,
      } as any);

      const response = await request(app).get("/api/elo/rankings");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "No rating data available");
    });
  });

  describe("GET /api/elo/clubs", () => {
    it("should search clubs by name", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            api_name: "ManCity",
            display_name: "Manchester City",
            country: "ENG",
            level: 1,
          },
          {
            id: 2,
            api_name: "ManUtd",
            display_name: "Manchester United",
            country: "ENG",
            level: 1,
          },
        ],
        rowCount: 2,
      } as any);

      const response = await request(app)
        .get("/api/elo/clubs")
        .query({ q: "Man" });

      expect(response.status).toBe(200);
      expect(response.body.clubs).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("LOWER(display_name) LIKE LOWER"),
        expect.arrayContaining(["%Man%"])
      );
    });

    it("should filter clubs by country", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get("/api/elo/clubs")
        .query({ country: "ESP" });

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("country = $1"),
        expect.arrayContaining(["ESP"])
      );
    });
  });

  describe("GET /api/elo/clubs/:id/history", () => {
    it("should get club history by ID", async () => {
      // Mock finding club
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              api_name: "ManCity",
              display_name: "Manchester City",
              country: "ENG",
              level: 1,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              date: new Date("2024-11-01"),
              elo: "1985.5",
              rank: 2,
            },
            {
              date: new Date("2024-11-02"),
              elo: "1997.5",
              rank: 1,
            },
          ],
          rowCount: 2,
        } as any);

      const response = await request(app).get("/api/elo/clubs/1/history");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("club");
      expect(response.body.club.id).toBe(1);
      expect(response.body).toHaveProperty("history");
      expect(response.body.history).toHaveLength(2);
      expect(response.body.history[0].elo).toBe(1985.5);
    });

    it("should get club history by API name", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              api_name: "ManCity",
              display_name: "Manchester City",
              country: "ENG",
              level: 1,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const response = await request(app).get("/api/elo/clubs/ManCity/history");

      expect(response.status).toBe(200);
      expect(response.body.club.apiName).toBe("ManCity");
    });

    it("should return 404 for non-existent club", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const response = await request(app).get("/api/elo/clubs/99999/history");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Club not found");
    });

    it("should filter history by date range", async () => {
      mockDb.query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              api_name: "ManCity",
              display_name: "Manchester City",
              country: "ENG",
              level: 1,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any);

      const response = await request(app)
        .get("/api/elo/clubs/1/history")
        .query({ from: "2024-01-01", to: "2024-12-31" });

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("date >= $2"),
        expect.arrayContaining([1, "2024-01-01", "2024-12-31"])
      );
    });
  });

  describe("GET /api/elo/fixtures", () => {
    it("should get fixtures", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            match_date: new Date("2024-11-25"),
            country: "ENG",
            competition: "Premier League",
            home_elo: "1997.5",
            away_elo: "1972.1",
            home_win_prob: "0.45",
            draw_prob: "0.28",
            away_win_prob: "0.27",
            home_club_id: 1,
            home_club_name: "Manchester City",
            home_club_country: "ENG",
            away_club_id: 2,
            away_club_name: "Liverpool",
            away_club_country: "ENG",
          },
        ],
        rowCount: 1,
      } as any);

      const response = await request(app).get("/api/elo/fixtures");

      expect(response.status).toBe(200);
      expect(response.body.fixtures).toHaveLength(1);
      expect(response.body.fixtures[0]).toMatchObject({
        homeTeam: {
          name: "Manchester City",
          elo: 1997.5,
        },
        awayTeam: {
          name: "Liverpool",
          elo: 1972.1,
        },
        predictions: {
          homeWin: 0.45,
          draw: 0.28,
          awayWin: 0.27,
        },
      });
    });

    it("should filter fixtures by date", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get("/api/elo/fixtures")
        .query({ date: "2024-11-25" });

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("f.match_date = $1"),
        expect.arrayContaining(["2024-11-25"])
      );
    });

    it("should filter fixtures by country", async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await request(app)
        .get("/api/elo/fixtures")
        .query({ country: "ESP" });

      expect(response.status).toBe(200);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("f.country = $1"),
        expect.any(Array)
      );
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for non-existent API routes", async () => {
      const response = await request(app).get("/api/non-existent");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Not found");
    });
  });
});
