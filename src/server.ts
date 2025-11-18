/**
 * Express API server for ClubElo data
 *
 * Provides REST endpoints to query club Elo ratings from our database.
 * This is what your frontend will call - never call ClubElo API directly!
 */

import express, { Request, Response } from 'express';
import { config } from './lib/config';
import { prisma } from './lib/db';

const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/elo/rankings
 *
 * Get club rankings for a specific date (or the latest available date).
 *
 * Query parameters:
 *   - date: ISO date string (YYYY-MM-DD), optional. Defaults to latest date.
 *   - country: Country code filter (e.g., "ENG"), optional. Defaults to all countries.
 *   - limit: Maximum number of results, optional. Defaults to 100.
 *
 * Example:
 *   GET /api/elo/rankings?date=2025-11-18&country=ENG&limit=20
 *
 * Response:
 *   {
 *     "date": "2025-11-18",
 *     "country": "ENG",
 *     "clubs": [
 *       {
 *         "id": 1,
 *         "apiName": "ManCity",
 *         "displayName": "Manchester City",
 *         "country": "ENG",
 *         "level": 1,
 *         "rank": 2,
 *         "elo": 1997
 *       },
 *       ...
 *     ]
 *   }
 */
app.get('/api/elo/rankings', async (req: Request, res: Response) => {
  try {
    const { date: dateParam, country, limit: limitParam } = req.query;
    const limit = limitParam ? parseInt(limitParam as string, 10) : 100;

    // Determine which date to use
    let targetDate: Date;

    if (dateParam) {
      // Use the provided date
      targetDate = new Date(dateParam as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    } else {
      // Find the latest date we have data for
      const latest = await prisma.eloRating.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      if (!latest) {
        return res.status(404).json({ error: 'No rating data available' });
      }

      targetDate = latest.date;
    }

    // Build the query
    const whereClause: any = { date: targetDate };
    if (country) {
      whereClause.country = country as string;
    }

    // Fetch ratings for this date
    const ratings = await prisma.eloRating.findMany({
      where: whereClause,
      include: {
        club: true,
      },
      orderBy: { elo: 'desc' },
      take: limit,
    });

    // Transform to response format
    const clubs = ratings.map(rating => ({
      id: rating.club.id,
      apiName: rating.club.apiName,
      displayName: rating.club.displayName,
      country: rating.club.country,
      level: rating.club.level,
      rank: rating.rank,
      elo: rating.elo,
    }));

    res.json({
      date: targetDate.toISOString().split('T')[0],
      country: country || null,
      clubs,
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/elo/clubs/:id/history
 *
 * Get the full Elo rating history for a specific club.
 *
 * Path parameters:
 *   - id: Club ID (integer) or API name (string)
 *
 * Query parameters:
 *   - from: Start date (YYYY-MM-DD), optional. Defaults to earliest.
 *   - to: End date (YYYY-MM-DD), optional. Defaults to latest.
 *
 * Example:
 *   GET /api/elo/clubs/1/history?from=2024-01-01&to=2024-12-31
 *   GET /api/elo/clubs/ManCity/history
 *
 * Response:
 *   {
 *     "club": {
 *       "id": 1,
 *       "apiName": "ManCity",
 *       "displayName": "Manchester City",
 *       "country": "ENG",
 *       "level": 1
 *     },
 *     "history": [
 *       { "date": "2024-08-10", "elo": 1950, "rank": 5 },
 *       { "date": "2024-08-17", "elo": 1960, "rank": 4 },
 *       ...
 *     ]
 *   }
 */
app.get('/api/elo/clubs/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from: fromParam, to: toParam } = req.query;

    // Find the club by ID or API name
    const clubId = parseInt(id, 10);
    const club = await prisma.club.findFirst({
      where: isNaN(clubId)
        ? { apiName: id }
        : { id: clubId },
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Build date range filter
    const dateFilter: any = {};
    if (fromParam) {
      const fromDate = new Date(fromParam as string);
      if (!isNaN(fromDate.getTime())) {
        dateFilter.gte = fromDate;
      }
    }
    if (toParam) {
      const toDate = new Date(toParam as string);
      if (!isNaN(toDate.getTime())) {
        dateFilter.lte = toDate;
      }
    }

    // Fetch rating history
    const ratings = await prisma.eloRating.findMany({
      where: {
        clubId: club.id,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        elo: true,
        rank: true,
      },
    });

    // Transform to response format
    const history = ratings.map(rating => ({
      date: rating.date.toISOString().split('T')[0],
      elo: rating.elo,
      rank: rating.rank,
    }));

    res.json({
      club: {
        id: club.id,
        apiName: club.apiName,
        displayName: club.displayName,
        country: club.country,
        level: club.level,
      },
      history,
    });

  } catch (error) {
    console.error('Error fetching club history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/elo/clubs
 *
 * List all clubs (useful for dropdowns, search, etc.)
 *
 * Query parameters:
 *   - q: Search query (searches in display name), optional
 *   - country: Filter by country code, optional
 *   - limit: Maximum number of results, optional. Defaults to 100.
 *
 * Example:
 *   GET /api/elo/clubs?q=Man
 *   GET /api/elo/clubs?country=ENG&limit=50
 *
 * Response:
 *   {
 *     "clubs": [
 *       {
 *         "id": 1,
 *         "apiName": "ManCity",
 *         "displayName": "Manchester City",
 *         "country": "ENG",
 *         "level": 1
 *       },
 *       ...
 *     ]
 *   }
 */
app.get('/api/elo/clubs', async (req: Request, res: Response) => {
  try {
    const { q, country, limit: limitParam } = req.query;
    const limit = limitParam ? parseInt(limitParam as string, 10) : 100;

    // Build where clause
    const whereClause: any = {};

    if (q) {
      // Search in display name (case-insensitive)
      whereClause.displayName = {
        contains: q as string,
        mode: 'insensitive',
      };
    }

    if (country) {
      whereClause.country = country as string;
    }

    // Fetch clubs
    const clubs = await prisma.club.findMany({
      where: whereClause,
      orderBy: { displayName: 'asc' },
      take: limit,
      select: {
        id: true,
        apiName: true,
        displayName: true,
        country: true,
        level: true,
      },
    });

    res.json({ clubs });

  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 ClubElo API server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/elo/rankings?date=YYYY-MM-DD&country=ENG&limit=100');
  console.log('  GET  /api/elo/clubs/:id/history?from=YYYY-MM-DD&to=YYYY-MM-DD');
  console.log('  GET  /api/elo/clubs?q=search&country=ENG&limit=100');
  console.log('');
});

export default app;
