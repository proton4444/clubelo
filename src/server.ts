/**
 * Express API server for ClubElo data
 *
 * Provides REST endpoints to query club Elo ratings from our database.
 * This is what your frontend will call - never call ClubElo API directly!
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { config } from './lib/config';
import { db } from './lib/db';

const app = express();

// Middleware
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

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
    let targetDate: string;

    if (dateParam) {
      // Validate the provided date
      const parsedDate = new Date(dateParam as string);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      targetDate = parsedDate.toISOString().split('T')[0];
    } else {
      // Find the latest date we have data for
      const latestResult = await db.query(
        'SELECT MAX(date) as max_date FROM elo_ratings'
      );

      if (!latestResult.rows[0].max_date) {
        return res.status(404).json({ error: 'No rating data available' });
      }

      targetDate = new Date(latestResult.rows[0].max_date).toISOString().split('T')[0];
    }

    // Build the query
    let query = `
      SELECT
        c.id, c.api_name, c.display_name, c.country, c.level,
        e.rank, e.elo
      FROM elo_ratings e
      JOIN clubs c ON e.club_id = c.id
      WHERE e.date = $1
    `;
    const params: any[] = [targetDate];

    if (country) {
      query += ' AND e.country = $2';
      params.push(country);
    }

    query += ' ORDER BY e.elo DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    // Fetch ratings for this date
    const result = await db.query(query, params);

    // Transform to response format
    const clubs = result.rows.map(row => ({
      id: row.id,
      apiName: row.api_name,
      displayName: row.display_name,
      country: row.country,
      level: row.level,
      rank: row.rank,
      elo: parseFloat(row.elo),
    }));

    res.json({
      date: targetDate,
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
    let clubQuery: string;
    let clubParams: any[];

    if (isNaN(clubId)) {
      // Search by API name
      clubQuery = 'SELECT * FROM clubs WHERE api_name = $1';
      clubParams = [id];
    } else {
      // Search by ID
      clubQuery = 'SELECT * FROM clubs WHERE id = $1';
      clubParams = [clubId];
    }

    const clubResult = await db.query(clubQuery, clubParams);

    if (clubResult.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const club = clubResult.rows[0];

    // Build history query
    let historyQuery = 'SELECT date, elo, rank FROM elo_ratings WHERE club_id = $1';
    const historyParams: any[] = [club.id];

    if (fromParam) {
      const fromDate = new Date(fromParam as string);
      if (!isNaN(fromDate.getTime())) {
        historyQuery += ' AND date >= $' + (historyParams.length + 1);
        historyParams.push(fromDate.toISOString().split('T')[0]);
      }
    }

    if (toParam) {
      const toDate = new Date(toParam as string);
      if (!isNaN(toDate.getTime())) {
        historyQuery += ' AND date <= $' + (historyParams.length + 1);
        historyParams.push(toDate.toISOString().split('T')[0]);
      }
    }

    historyQuery += ' ORDER BY date ASC';

    // Fetch rating history
    const historyResult = await db.query(historyQuery, historyParams);

    // Transform to response format
    const history = historyResult.rows.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      elo: parseFloat(row.elo),
      rank: row.rank,
    }));

    res.json({
      club: {
        id: club.id,
        apiName: club.api_name,
        displayName: club.display_name,
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

    // Build query
    let query = 'SELECT id, api_name, display_name, country, level FROM clubs WHERE 1=1';
    const params: any[] = [];

    if (q) {
      // Search in display name (case-insensitive)
      query += ' AND LOWER(display_name) LIKE LOWER($' + (params.length + 1) + ')';
      params.push(`%${q}%`);
    }

    if (country) {
      query += ' AND country = $' + (params.length + 1);
      params.push(country);
    }

    query += ' ORDER BY display_name ASC LIMIT $' + (params.length + 1);
    params.push(limit);

    // Fetch clubs
    const result = await db.query(query, params);

    const clubs = result.rows.map(row => ({
      id: row.id,
      apiName: row.api_name,
      displayName: row.display_name,
      country: row.country,
      level: row.level,
    }));

    res.json({ clubs });

  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for root path
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler for API routes only
app.use('/api/*', (req: Request, res: Response) => {
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
