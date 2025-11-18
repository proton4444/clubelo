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
 *   - country: Country code filter (e.g., "ENG"), optional.
 *   - level: League level filter (1, 2, etc.), optional.
 *   - minElo: Minimum Elo rating filter, optional.
 *   - page: Page number for pagination (starts at 1), optional. Defaults to 1.
 *   - pageSize: Number of results per page, optional. Defaults to 100.
 *   - limit: Legacy param, use pageSize instead. Optional.
 *
 * Example:
 *   GET /api/elo/rankings?date=2025-11-18&country=ENG&level=1&page=1&pageSize=20
 *   GET /api/elo/rankings?minElo=1900&pageSize=50
 *
 * Response:
 *   {
 *     "date": "2025-11-18",
 *     "country": "ENG",
 *     "clubs": [...],
 *     "pagination": {
 *       "page": 1,
 *       "pageSize": 20,
 *       "total": 100,
 *       "totalPages": 5
 *     }
 *   }
 */
app.get('/api/elo/rankings', async (req: Request, res: Response) => {
  try {
    const {
      date: dateParam,
      country,
      level: levelParam,
      minElo: minEloParam,
      page: pageParam,
      pageSize: pageSizeParam,
      limit: limitParam, // Legacy support
    } = req.query;

    // Parse pagination parameters
    const page = pageParam ? parseInt(pageParam as string, 10) : 1;
    const pageSize = pageSizeParam
      ? parseInt(pageSizeParam as string, 10)
      : (limitParam ? parseInt(limitParam as string, 10) : 100);
    const offset = (page - 1) * pageSize;

    // Parse filter parameters
    const level = levelParam ? parseInt(levelParam as string, 10) : null;
    const minElo = minEloParam ? parseFloat(minEloParam as string) : null;

    // Validate pagination
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be >= 1' });
    }
    if (pageSize < 1 || pageSize > 1000) {
      return res.status(400).json({ error: 'Page size must be between 1 and 1000' });
    }

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

    // Build the WHERE clause
    const whereClauses = ['e.date = $1'];
    const params: any[] = [targetDate];

    if (country) {
      whereClauses.push(`e.country = $${params.length + 1}`);
      params.push(country);
    }

    if (level !== null) {
      whereClauses.push(`e.level = $${params.length + 1}`);
      params.push(level);
    }

    if (minElo !== null) {
      whereClauses.push(`e.elo >= $${params.length + 1}`);
      params.push(minElo);
    }

    const whereClause = whereClauses.join(' AND ');

    // Count total results for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM elo_ratings e
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalResults = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalResults / pageSize);

    // Build the main query with pagination
    const query = `
      SELECT
        c.id, c.api_name, c.display_name, c.country, c.level,
        e.rank, e.elo
      FROM elo_ratings e
      JOIN clubs c ON e.club_id = c.id
      WHERE ${whereClause}
      ORDER BY e.elo DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(pageSize, offset);

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
      level: level,
      minElo: minElo,
      clubs,
      pagination: {
        page,
        pageSize,
        total: totalResults,
        totalPages,
      },
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

/**
 * GET /api/elo/fixtures
 *
 * Get upcoming or recent match fixtures with Elo-based predictions.
 *
 * Query parameters:
 *   - date: Single date (YYYY-MM-DD) or date range, optional
 *   - from: Start date for range (YYYY-MM-DD), optional
 *   - to: End date for range (YYYY-MM-DD), optional
 *   - country: Filter by country code, optional
 *   - competition: Filter by competition name, optional
 *   - limit: Maximum number of results, optional. Defaults to 100.
 *
 * Example:
 *   GET /api/elo/fixtures
 *   GET /api/elo/fixtures?date=2025-11-20
 *   GET /api/elo/fixtures?from=2025-11-20&to=2025-11-30
 *   GET /api/elo/fixtures?country=ENG&competition=Premier%20League
 *
 * Response:
 *   {
 *     "fixtures": [
 *       {
 *         "id": 1,
 *         "matchDate": "2025-11-20",
 *         "homeTeam": {
 *           "id": 1,
 *           "name": "Manchester City",
 *           "country": "ENG",
 *           "elo": 1997.5
 *         },
 *         "awayTeam": {
 *           "id": 2,
 *           "name": "Liverpool",
 *           "country": "ENG",
 *           "elo": 1972.1
 *         },
 *         "country": "ENG",
 *         "competition": "Premier League",
 *         "predictions": {
 *           "homeWin": 0.45,
 *           "draw": 0.28,
 *           "awayWin": 0.27
 *         }
 *       },
 *       ...
 *     ]
 *   }
 */
app.get('/api/elo/fixtures', async (req: Request, res: Response) => {
  try {
    const {
      date: dateParam,
      from: fromParam,
      to: toParam,
      country,
      competition,
      limit: limitParam,
    } = req.query;

    const limit = limitParam ? parseInt(limitParam as string, 10) : 100;

    // Build the WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Handle date filtering
    if (dateParam) {
      // Single date
      const date = new Date(dateParam as string);
      if (!isNaN(date.getTime())) {
        whereClauses.push(`f.match_date = $${params.length + 1}`);
        params.push(date.toISOString().split('T')[0]);
      }
    } else if (fromParam || toParam) {
      // Date range
      if (fromParam) {
        const fromDate = new Date(fromParam as string);
        if (!isNaN(fromDate.getTime())) {
          whereClauses.push(`f.match_date >= $${params.length + 1}`);
          params.push(fromDate.toISOString().split('T')[0]);
        }
      }
      if (toParam) {
        const toDate = new Date(toParam as string);
        if (!isNaN(toDate.getTime())) {
          whereClauses.push(`f.match_date <= $${params.length + 1}`);
          params.push(toDate.toISOString().split('T')[0]);
        }
      }
    }

    if (country) {
      whereClauses.push(`f.country = $${params.length + 1}`);
      params.push(country);
    }

    if (competition) {
      whereClauses.push(`f.competition ILIKE $${params.length + 1}`);
      params.push(`%${competition}%`);
    }

    const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Build the query
    const query = `
      SELECT
        f.id, f.match_date, f.country, f.competition,
        f.home_elo, f.away_elo,
        f.home_win_prob, f.draw_prob, f.away_win_prob,
        hc.id as home_club_id, hc.display_name as home_club_name,
        hc.country as home_club_country,
        ac.id as away_club_id, ac.display_name as away_club_name,
        ac.country as away_club_country
      FROM fixtures f
      JOIN clubs hc ON f.home_club_id = hc.id
      JOIN clubs ac ON f.away_club_id = ac.id
      ${whereClause}
      ORDER BY f.match_date ASC, f.id ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    // Fetch fixtures
    const result = await db.query(query, params);

    // Transform to response format
    const fixtures = result.rows.map(row => ({
      id: row.id,
      matchDate: new Date(row.match_date).toISOString().split('T')[0],
      homeTeam: {
        id: row.home_club_id,
        name: row.home_club_name,
        country: row.home_club_country,
        elo: parseFloat(row.home_elo),
      },
      awayTeam: {
        id: row.away_club_id,
        name: row.away_club_name,
        country: row.away_club_country,
        elo: parseFloat(row.away_elo),
      },
      country: row.country,
      competition: row.competition,
      predictions: {
        homeWin: row.home_win_prob !== null ? parseFloat(row.home_win_prob) : null,
        draw: row.draw_prob !== null ? parseFloat(row.draw_prob) : null,
        awayWin: row.away_win_prob !== null ? parseFloat(row.away_win_prob) : null,
      },
    }));

    res.json({ fixtures });

  } catch (error) {
    console.error('Error fetching fixtures:', error);
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
