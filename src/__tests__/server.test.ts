/**
 * Integration tests for API endpoints
 *
 * Tests all API endpoints with various parameters and error conditions
 */

import request from 'supertest';

// Mock the database module BEFORE any imports
jest.mock('../lib/db', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Import after mocking
import app from '../server';
import { db } from '../lib/db';

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/elo/rankings', () => {
    it('should return rankings for a specific date', async () => {
      // Mock database responses
      // First call: count query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '1' }],
      });

      // Second call: main query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            api_name: 'ManCity',
            display_name: 'Manchester City',
            country: 'ENG',
            level: 1,
            rank: 1,
            elo: 2050.5,
          },
        ],
      });

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18')
        .expect(200);

      expect(response.body).toHaveProperty('date', '2025-11-18');
      expect(response.body).toHaveProperty('clubs');
      expect(response.body.clubs).toHaveLength(1);
      expect(response.body.clubs[0]).toMatchObject({
        displayName: 'Manchester City',
        elo: 2050.5,
        rank: 1,
      });
    });

    it('should filter by country', async () => {
      // Count query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }],
      });
      // Main query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18&country=ENG')
        .expect(200);

      // Verify the count query was called with country filter
      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('country'),
        expect.arrayContaining(['2025-11-18', 'ENG'])
      );
    });

    it('should filter by level', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }],
      });
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18&level=1')
        .expect(200);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('level'),
        expect.arrayContaining(['2025-11-18', 1])
      );
    });

    it('should filter by minimum Elo', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }],
      });
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18&minElo=2000')
        .expect(200);

      expect(db.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('elo >='),
        expect.arrayContaining(['2025-11-18', 2000])
      );
    });

    it('should support pagination', async () => {
      // Mock count query (uses 'total' not 'count')
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18&page=2&pageSize=20')
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 2,
        pageSize: 20,
        total: 100,
        totalPages: 5,
      });

      // Verify OFFSET was used in the main query
      expect(db.query).toHaveBeenNthCalledWith(
        2, // Second call is the main query
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['2025-11-18', 20, 20]) // date, pageSize, offset
      );
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/elo/rankings?date=invalid-date')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors', async () => {
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/elo/rankings?date=2025-11-18')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/elo/clubs/:id/history', () => {
    it('should return club history by ID', async () => {
      // Mock club query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            api_name: 'ManCity',
            display_name: 'Manchester City',
            country: 'ENG',
            level: 1,
          },
        ],
      });

      // Mock ratings query
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { date: '2025-11-01', elo: 2000.0, rank: 2 },
          { date: '2025-11-18', elo: 2050.5, rank: 1 },
        ],
      });

      const response = await request(app)
        .get('/api/elo/clubs/1/history')
        .expect(200);

      expect(response.body).toHaveProperty('club');
      expect(response.body.club.displayName).toBe('Manchester City');
      expect(response.body).toHaveProperty('history');
      expect(response.body.history).toHaveLength(2);
    });

    it('should return club history by API name', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: 1, api_name: 'ManCity', display_name: 'Manchester City' }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      const response = await request(app)
        .get('/api/elo/clubs/ManCity/history')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('api_name'),
        expect.arrayContaining(['ManCity'])
      );
    });

    it('should support date range filters', async () => {
      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/clubs/1/history?from=2025-11-01&to=2025-11-30')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('date >='),
        expect.arrayContaining([expect.any(Number), '2025-11-01', '2025-11-30'])
      );
    });

    it('should return 404 for non-existent club', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/clubs/999/history')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Club not found');
    });
  });

  describe('GET /api/elo/clubs', () => {
    it('should return all clubs without filters', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: 1, api_name: 'ManCity', display_name: 'Manchester City', country: 'ENG' },
          { id: 2, api_name: 'Liverpool', display_name: 'Liverpool FC', country: 'ENG' },
        ],
      });

      const response = await request(app)
        .get('/api/elo/clubs')
        .expect(200);

      expect(response.body.clubs).toHaveLength(2);
    });

    it('should search clubs by name', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { id: 1, api_name: 'ManCity', display_name: 'Manchester City', country: 'ENG' },
        ],
      });

      const response = await request(app)
        .get('/api/elo/clubs?q=Manchester')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(display_name) LIKE LOWER'),
        expect.arrayContaining(['%Manchester%'])
      );
    });

    it('should filter by country', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/clubs?country=ENG')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('country'),
        expect.arrayContaining(['ENG'])
      );
    });

    it('should limit results', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/clubs?limit=10')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10])
      );
    });
  });

  describe('GET /api/elo/fixtures', () => {
    it('should return all fixtures without filters', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            match_date: '2025-11-23',
            home_club_id: 1,
            away_club_id: 2,
            home_club_name: 'Manchester City',
            away_club_name: 'Liverpool FC',
            home_club_country: 'ENG',
            away_club_country: 'ENG',
            home_elo: 2050.5,
            away_elo: 2010.3,
            home_win_prob: 0.55,
            draw_prob: 0.25,
            away_win_prob: 0.20,
            country: 'ENG',
            competition: 'Premier League',
          },
        ],
      });

      const response = await request(app)
        .get('/api/elo/fixtures')
        .expect(200);

      expect(response.body.fixtures).toHaveLength(1);
      expect(response.body.fixtures[0]).toMatchObject({
        id: 1,
        matchDate: '2025-11-23',
        homeTeam: {
          id: 1,
          name: 'Manchester City',
          country: 'ENG',
          elo: 2050.5,
        },
        awayTeam: {
          id: 2,
          name: 'Liverpool FC',
          country: 'ENG',
          elo: 2010.3,
        },
        country: 'ENG',
        competition: 'Premier League',
        predictions: {
          homeWin: 0.55,
          draw: 0.25,
          awayWin: 0.20,
        },
      });
    });

    it('should filter by specific date', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/fixtures?date=2025-11-23')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('match_date ='),
        expect.arrayContaining(['2025-11-23'])
      );
    });

    it('should filter by date range', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/fixtures?from=2025-11-20&to=2025-11-30')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('match_date >='),
        expect.anything()
      );
    });

    it('should filter by country', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/fixtures?country=ENG')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('f.country'),
        expect.arrayContaining(['ENG'])
      );
    });

    it('should filter by competition', async () => {
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/elo/fixtures?competition=Premier%20League')
        .expect(200);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('competition'),
        expect.arrayContaining(['%Premier League%', 100])
      );
    });
  });
});
