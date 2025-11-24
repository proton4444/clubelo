/**
 * API E2E Tests
 *
 * Tests all API endpoints to ensure they work correctly.
 * These tests run against the live server (local or Vercel).
 */

import { test, expect } from '@playwright/test';

test.describe('ClubElo API', () => {
  test.describe('Health Check', () => {
    test('should return 200 OK', async ({ request }) => {
      const response = await request.get('/health');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
    });

    test('should have valid ISO timestamp', async ({ request }) => {
      const response = await request.get('/health');
      const body = await response.json();

      // Verify it's a valid ISO string
      expect(() => new Date(body.timestamp)).not.toThrow();
      expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/elo/rankings', () => {
    test('should return rankings with default pagination', async ({ request }) => {
      const response = await request.get('/api/elo/rankings');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('date');
      expect(body).toHaveProperty('clubs');
      expect(body).toHaveProperty('pagination');

      // Verify pagination defaults
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.pageSize).toBe(100);
      expect(body.pagination).toHaveProperty('total');
      expect(body.pagination).toHaveProperty('totalPages');
    });

    test('should support country filter', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?country=ENG');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.country).toBe('ENG');
      expect(Array.isArray(body.clubs)).toBe(true);

      // All clubs should be from ENG
      body.clubs.forEach((club: any) => {
        expect(club.country).toBe('ENG');
      });
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?page=2&pageSize=20');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.pagination.page).toBe(2);
      expect(body.pagination.pageSize).toBe(20);
      expect(body.clubs.length).toBeLessThanOrEqual(20);
    });

    test('should reject invalid page', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?page=0');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('should reject invalid pageSize', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?pageSize=2000');
      expect(response.status()).toBe(400);
    });

    test('should support minElo filter', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?minElo=1900');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.minElo).toBe(1900);

      // All clubs should have elo >= 1900
      body.clubs.forEach((club: any) => {
        expect(club.elo).toBeGreaterThanOrEqual(1900);
      });
    });

    test('should support level filter', async ({ request }) => {
      const response = await request.get('/api/elo/rankings?level=1');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.level).toBe(1);

      // All clubs should be level 1
      body.clubs.forEach((club: any) => {
        expect(club.level).toBe(1);
      });
    });
  });

  test.describe('GET /api/elo/clubs', () => {
    test('should list clubs', async ({ request }) => {
      const response = await request.get('/api/elo/clubs');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('clubs');
      expect(Array.isArray(body.clubs)).toBe(true);
    });

    test('should search by name', async ({ request }) => {
      const response = await request.get('/api/elo/clubs?q=Man');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.clubs.length).toBeGreaterThan(0);

      // All results should match search term (case-insensitive)
      body.clubs.forEach((club: any) => {
        expect(club.displayName.toLowerCase()).toContain('man');
      });
    });

    test('should filter by country', async ({ request }) => {
      const response = await request.get('/api/elo/clubs?country=ENG');
      expect(response.status()).toBe(200);

      const body = await response.json();
      body.clubs.forEach((club: any) => {
        expect(club.country).toBe('ENG');
      });
    });

    test('should support limit parameter', async ({ request }) => {
      const response = await request.get('/api/elo/clubs?limit=5');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.clubs.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('GET /api/elo/clubs/:id/history', () => {
    test('should get club history by ID', async ({ request }) => {
      // First, get a club
      const clubsResponse = await request.get('/api/elo/clubs?limit=1');
      const clubs = await clubsResponse.json();

      if (clubs.clubs.length === 0) {
        test.skip();
      }

      const clubId = clubs.clubs[0].id;

      // Then get its history
      const response = await request.get(`/api/elo/clubs/${clubId}/history`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('club');
      expect(body).toHaveProperty('history');
      expect(body.club.id).toBe(clubId);
      expect(Array.isArray(body.history)).toBe(true);
    });

    test('should get club history by API name', async ({ request }) => {
      // First, get a club
      const clubsResponse = await request.get('/api/elo/clubs?limit=1');
      const clubs = await clubsResponse.json();

      if (clubs.clubs.length === 0) {
        test.skip();
      }

      const apiName = clubs.clubs[0].apiName;

      // Then get its history by API name
      const response = await request.get(`/api/elo/clubs/${apiName}/history`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.club.apiName).toBe(apiName);
    });

    test('should return 404 for non-existent club', async ({ request }) => {
      const response = await request.get('/api/elo/clubs/99999/history');
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error', 'Club not found');
    });

    test('should support date range filter', async ({ request }) => {
      const clubsResponse = await request.get('/api/elo/clubs?limit=1');
      const clubs = await clubsResponse.json();

      if (clubs.clubs.length === 0) {
        test.skip();
      }

      const clubId = clubs.clubs[0].id;

      const response = await request.get(
        `/api/elo/clubs/${clubId}/history?from=2024-01-01&to=2024-12-31`
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      body.history.forEach((entry: any) => {
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(entry.date).getTime()).toBeGreaterThanOrEqual(
          new Date('2024-01-01').getTime()
        );
        expect(new Date(entry.date).getTime()).toBeLessThanOrEqual(
          new Date('2024-12-31').getTime()
        );
      });
    });
  });

  test.describe('GET /api/elo/fixtures', () => {
    test('should get fixtures', async ({ request }) => {
      const response = await request.get('/api/elo/fixtures');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('fixtures');
      expect(Array.isArray(body.fixtures)).toBe(true);
    });

    test('should support country filter', async ({ request }) => {
      const response = await request.get('/api/elo/fixtures?country=ENG');
      expect(response.status()).toBe(200);

      const body = await response.json();
      body.fixtures.forEach((fixture: any) => {
        expect(fixture.country).toBe('ENG');
      });
    });

    test('should support limit parameter', async ({ request }) => {
      const response = await request.get('/api/elo/fixtures?limit=5');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.fixtures.length).toBeLessThanOrEqual(5);
    });

    test('should include predictions', async ({ request }) => {
      const response = await request.get('/api/elo/fixtures?limit=1');
      expect(response.status()).toBe(200);

      const body = await response.json();
      if (body.fixtures.length > 0) {
        const fixture = body.fixtures[0];
        expect(fixture).toHaveProperty('predictions');
        expect(fixture.predictions).toHaveProperty('homeWin');
        expect(fixture.predictions).toHaveProperty('draw');
        expect(fixture.predictions).toHaveProperty('awayWin');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent endpoint', async ({ request }) => {
      const response = await request.get('/api/non-existent');
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error', 'Not found');
    });

    test('should return 404 for non-existent API route', async ({ request }) => {
      const response = await request.get('/api/elo/non-existent');
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('should handle invalid JSON gracefully', async ({ request }) => {
      const response = await request.get(
        '/api/elo/rankings?country=<invalid>&level=xyz'
      );
      // Should either return 400 or handle gracefully
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('Response Format', () => {
    test('should return valid JSON for all endpoints', async ({ request }) => {
      const endpoints = [
        '/health',
        '/api/elo/rankings',
        '/api/elo/clubs',
        '/api/elo/fixtures',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(endpoint);
        expect(response.ok()).toBe(true);

        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');

        // Should not throw when parsing JSON
        await expect(response.json()).resolves.toBeDefined();
      }
    });
  });
});
