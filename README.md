# ClubElo Data Layer

This is a **fast-path data layer** for building a better ClubElo-like site. It imports football club Elo ratings from the [ClubElo public API](http://clubelo.com) into your own PostgreSQL database, then serves that data via a simple REST API.

**Key principle:** Your frontend will NEVER call ClubElo directly. All data flows through your own database and API.

## 📋 Table of Contents

- [What This Does](#what-this-does)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [Importing Data](#importing-data)
- [API Endpoints](#api-endpoints)
- [Scheduling Imports](#scheduling-imports)
- [Project Structure](#project-structure)

---

## What This Does

This project provides:

1. **Database schema** for storing club Elo ratings
2. **Import scripts** to fetch and store data from ClubElo's CSV API
3. **REST API** to query the data (for your frontend)

It's designed for:
- **Football (soccer)** Elo ratings only (for now)
- **Batch imports** (not real-time) to avoid hammering ClubElo's servers
- **Easy extension** for other sports later

---

## Tech Stack

- **Node.js** with **TypeScript**
- **PostgreSQL** database
- **node-postgres (pg)** - native PostgreSQL driver
- **Express** (for REST API)
- **csv-parse** (for parsing ClubElo CSV data)

---

## Setup Instructions

### 1. Prerequisites

Make sure you have installed:
- **Node.js** 18+ ([download here](https://nodejs.org/))
- **PostgreSQL** 14+ ([download here](https://www.postgresql.org/download/))

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` and set your database connection string:

```env
# Using Unix socket for local development (simplest, no password needed)
DATABASE_URL="postgresql://postgres@/clubelo?host=/var/run/postgresql"

# Or for remote/TCP connections:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/clubelo"

CLUBELO_API_BASE="http://api.clubelo.com"
PORT=3000
```

**Note:** The Unix socket connection (`?host=/var/run/postgresql`) is simpler for local development and doesn't require a password. For remote connections, use the TCP format with your actual credentials.

### 4. Create the Database

If you haven't already, create a PostgreSQL database:

```bash
# Using psql
createdb clubelo

# Or using SQL
psql -c "CREATE DATABASE clubelo;"
```

### 5. Create Database Schema

Apply the SQL schema to create the `clubs` and `elo_ratings` tables:

```bash
psql -d clubelo -f schema.sql
```

You should see output confirming the tables were created.

**Optional:** Load sample test data to try out the API immediately:

```bash
psql -d clubelo -f test-data.sql
```

This loads 10 sample clubs with ratings for testing.

---

## Database Schema

### `clubs` table

Stores basic information about each football club:

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `api_name` | String (unique) | Name used in ClubElo API (e.g., "ManCity") |
| `display_name` | String | Human-readable name (e.g., "Manchester City") |
| `country` | String | Country code (e.g., "ENG") |
| `level` | Integer | League level (1 = top division) |
| `created_at` | Timestamp | When the club was added |
| `updated_at` | Timestamp | When the club was last updated |

### `elo_ratings` table

Stores daily Elo rating snapshots for each club:

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `club_id` | Integer | Foreign key to `clubs.id` |
| `date` | Date | The date this rating applies to |
| `rank` | Integer | Club's rank on this date |
| `country` | String | Country code (duplicated for query performance) |
| `level` | Integer | League level |
| `elo` | Float | The Elo rating value |
| `source` | String | Rating source (default: "clubelo") |

**Key constraints:**
- Unique index on `(club_id, date)` - only one rating per club per day
- Index on `date` - for fast date-based queries
- Index on `country` - for filtering by country

---

## Importing Data

### Import a Daily Snapshot

This fetches all club ratings for a specific date and imports them into your database.

**Basic usage:**

```bash
npm run import:clubelo -- --date=2025-11-18
```

**Without a date (defaults to yesterday):**

```bash
npm run import:clubelo
```

**What it does:**
1. Calls `http://api.clubelo.com/2025-11-18`
2. Parses the CSV response
3. Creates/updates club records
4. Creates/updates Elo ratings for that date

**It's safe to run multiple times** - it will just update existing data (upsert).

### Import Full History for One Club

This fetches all historical ratings for a single club.

**Usage:**

```bash
npm run import:clubelo:club -- --club="ManCity"
```

**Other examples:**

```bash
npm run import:clubelo:club -- --club="Liverpool"
npm run import:clubelo:club -- --club="RealMadrid"
npm run import:clubelo:club -- --club="Barcelona"
```

**What it does:**
1. Calls `http://api.clubelo.com/ManCity`
2. Parses the CSV response (contains full history)
3. Creates/updates the club record
4. Creates/updates all historical Elo ratings

**Use this for:**
- Backfilling complete history for specific clubs
- Testing the import system
- Getting detailed data before you have daily snapshots

---

## API Endpoints

Start the API server:

```bash
npm run dev
```

The server runs on `http://localhost:3000` (or the port in your `.env`).

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

### GET `/api/elo/rankings`

Get club rankings for a specific date (or the latest available).

**Query parameters:**
- `date` (optional): ISO date string (YYYY-MM-DD). Defaults to latest.
- `country` (optional): Country code filter (e.g., "ENG"). Defaults to all.
- `limit` (optional): Maximum results. Defaults to 100.

**Examples:**

```bash
# Latest rankings for all countries (top 100)
curl http://localhost:3000/api/elo/rankings

# Rankings for a specific date
curl http://localhost:3000/api/elo/rankings?date=2025-11-18

# Top 20 English clubs
curl http://localhost:3000/api/elo/rankings?country=ENG&limit=20

# Spanish clubs on a specific date
curl "http://localhost:3000/api/elo/rankings?date=2025-11-18&country=ESP&limit=50"
```

**Response:**

```json
{
  "date": "2025-11-18",
  "country": "ENG",
  "clubs": [
    {
      "id": 1,
      "apiName": "ManCity",
      "displayName": "Manchester City",
      "country": "ENG",
      "level": 1,
      "rank": 2,
      "elo": 1997
    }
  ]
}
```

### GET `/api/elo/clubs/:id/history`

Get the full Elo rating history for a specific club.

**Path parameters:**
- `id`: Club ID (integer) or API name (string)

**Query parameters:**
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

**Examples:**

```bash
# Full history by club ID
curl http://localhost:3000/api/elo/clubs/1/history

# Full history by API name
curl http://localhost:3000/api/elo/clubs/ManCity/history

# History for a date range
curl "http://localhost:3000/api/elo/clubs/ManCity/history?from=2024-01-01&to=2024-12-31"

# Last year of data
curl "http://localhost:3000/api/elo/clubs/Liverpool/history?from=2024-11-18"
```

**Response:**

```json
{
  "club": {
    "id": 1,
    "apiName": "ManCity",
    "displayName": "Manchester City",
    "country": "ENG",
    "level": 1
  },
  "history": [
    { "date": "2024-08-10", "elo": 1950, "rank": 5 },
    { "date": "2024-08-17", "elo": 1960, "rank": 4 }
  ]
}
```

### GET `/api/elo/clubs`

List all clubs (useful for dropdowns, search, etc.)

**Query parameters:**
- `q` (optional): Search query (searches in display name)
- `country` (optional): Filter by country code
- `limit` (optional): Maximum results. Defaults to 100.

**Examples:**

```bash
# All clubs
curl http://localhost:3000/api/elo/clubs

# Search for clubs with "Man" in the name
curl http://localhost:3000/api/elo/clubs?q=Man

# All English clubs
curl http://localhost:3000/api/elo/clubs?country=ENG

# Search English clubs
curl "http://localhost:3000/api/elo/clubs?q=United&country=ENG"
```

**Response:**

```json
{
  "clubs": [
    {
      "id": 1,
      "apiName": "ManCity",
      "displayName": "Manchester City",
      "country": "ENG",
      "level": 1
    }
  ]
}
```

---

## Scheduling Imports

For production, you'll want to automatically import new data daily.

### Using Cron (Linux/macOS)

Edit your crontab:

```bash
crontab -e
```

Add a line to run daily at 6 AM:

```cron
0 6 * * * cd /path/to/clubelo && npm run import:clubelo >> /var/log/clubelo-import.log 2>&1
```

### Using Windows Task Scheduler

1. Open Task Scheduler
2. Create a new task
3. Set trigger to daily at 6 AM
4. Set action to run:
   ```
   cmd.exe /c "cd C:\path\to\clubelo && npm run import:clubelo"
   ```

### Manual Daily Import

For now, you can just run this command each day:

```bash
# Import yesterday's data
npm run import:clubelo

# Or import a specific date
npm run import:clubelo -- --date=2025-11-18
```

---

## Project Structure

```
clubelo/
├── prisma/
│   └── schema.prisma          # Database schema definition
├── src/
│   ├── lib/
│   │   ├── clubelo-api.ts     # ClubElo API client (fetches CSV)
│   │   ├── config.ts          # Configuration (env vars)
│   │   ├── db.ts              # Prisma client singleton
│   │   └── importer.ts        # Import logic (upsert data)
│   ├── scripts/
│   │   ├── import-daily.ts    # Daily snapshot import script
│   │   └── import-club.ts     # Single club history import script
│   └── server.ts              # Express API server
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Node.js dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file!
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Create database schema
psql -d clubelo -f schema.sql

# Load sample test data
psql -d clubelo -f test-data.sql

# Import daily snapshot from ClubElo API
npm run import:clubelo -- --date=2025-11-18

# Import full history for a specific club
npm run import:clubelo:club -- --club="ManCity"

# Start API server (development with auto-reload)
npm run dev

# Build TypeScript to JavaScript (for production)
npm run build

# Start API server (production)
npm start
```

---

## What's Next?

This is your **fast-path data layer**. From here you can:

1. **Build a frontend** that calls your API endpoints
2. **Import more historical data** using the club history script
3. **Add more sports** (tennis, etc.) by extending the schema
4. **Implement your own Elo calculations** and store them with `source='custom'`

Remember: Your frontend should ONLY query your API, never ClubElo directly!

---

## Troubleshooting

### "DATABASE_URL environment variable is required"

Make sure you:
1. Created a `.env` file (copy from `.env.example`)
2. Set a valid `DATABASE_URL` in `.env`

### "Failed to fetch data" errors

- Check your internet connection
- Verify the date format is YYYY-MM-DD
- ClubElo API might be temporarily down
- For club names, check the exact spelling (case-sensitive)

### "No rating data available"

You need to import some data first! Run:

```bash
npm run import:clubelo -- --date=2025-11-18
```

### Prisma errors

If you get schema errors, try:

```bash
npm run db:generate
npm run db:migrate
```

---

## License

See [LICENSE](LICENSE) file.
