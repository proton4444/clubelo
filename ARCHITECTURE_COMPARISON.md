# Architecture Comparison: Before → After

## Side-by-Side Code Comparison

### Example: GET /api/elo/rankings Endpoint

#### ❌ BEFORE (server.ts - Lines 65-180)

```typescript
// 115 lines of MIXED concerns in ONE function

app.get("/api/elo/rankings", async (req: Request, res: Response) => {
  try {
    const {
      date: dateParam,
      country,
      level: levelParam,
      minElo: minEloParam,
      page: pageParam,
      pageSize: pageSizeParam,
      limit: limitParam,
    } = req.query;

    // ❌ CONCERN 1: Parameter parsing & validation (20 lines)
    const page = pageParam ? parseInt(pageParam as string, 10) : 1;
    const pageSize = pageSizeParam
      ? parseInt(pageSizeParam as string, 10)
      : limitParam ? parseInt(limitParam as string, 10) : 100;
    const offset = (page - 1) * pageSize;
    const level = levelParam ? parseInt(levelParam as string, 10) : null;
    const minElo = minEloParam ? parseFloat(minEloParam as string) : null;

    if (page < 1) {
      return res.status(400).json({ error: "Page must be >= 1" });
    }
    if (pageSize < 1 || pageSize > 1000) {
      return res.status(400).json({ error: "Page size must be between 1 and 1000" });
    }

    // ❌ CONCERN 2: Business logic - date handling (25 lines)
    let targetDate: string;

    if (dateParam) {
      const parsedDate = new Date(dateParam as string);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      targetDate = formatDateOnly(parsedDate)!;
    } else {
      const latestResult = await db.query(
        "SELECT MAX(date)::text as max_date FROM elo_ratings"
      );

      if (!latestResult.rows[0].max_date) {
        return res.status(404).json({ error: "No rating data available" });
      }

      targetDate = latestResult.rows[0].max_date;
    }

    // ❌ CONCERN 3: SQL query construction (40 lines)
    const whereClauses = ["e.date = $1"];
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

    const whereClause = whereClauses.join(" AND ");

    // ❌ CONCERN 4: Database queries (15 lines)
    const countQuery = `SELECT COUNT(*) as total FROM elo_ratings e WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalResults = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalResults / pageSize);

    const query = `
      SELECT c.id, c.api_name, c.display_name, c.country, c.level, e.rank, e.elo
      FROM elo_ratings e
      JOIN clubs c ON e.club_id = c.id
      WHERE ${whereClause}
      ORDER BY e.elo DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(pageSize, offset);

    const result = await db.query(query, params);

    // ❌ CONCERN 5: Response transformation (15 lines)
    const clubs = result.rows.map((row) => ({
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
      pagination: { page, pageSize, total: totalResults, totalPages },
    });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**Problems:**
- 115 lines doing 5 different things
- SQL strings embedded in route handler
- Manual parameter binding (`$${params.length + 1}`)
- Hard to test (can't mock database easily)
- Hard to reuse (logic is in HTTP handler)
- Error handling with try/catch (repeated pattern)

---

#### ✅ AFTER (Modular - 4 separate files)

**1. rankings.types.ts (Contract)**
```typescript
export interface RankingsFilters {
  date?: string;
  country?: string;
  level?: number;
  minElo?: number;
  pagination: PaginationParams;
}

export interface RankingsResponse {
  date: string;
  country: string | null;
  level: number | null;
  minElo: number | null;
  clubs: ClubRanking[];
  pagination: PaginationMeta;
}
```

**2. rankings.repository.ts (Data Access - 40 lines)**
```typescript
export async function getLatestRatingsDate(): Promise<string | null> {
  const result = await db.query<{ max_date: string }>(
    "SELECT MAX(date)::text as max_date FROM elo_ratings"
  );
  return result.rows[0]?.max_date || null;
}

export async function countRankings(
  date: string,
  country?: string,
  level?: number,
  minElo?: number
): Promise<number> {
  const whereClauses = ["e.date = $1"];
  const params: any[] = [date];

  if (country) {
    whereClauses.push(`e.country = $${params.length + 1}`);
    params.push(country);
  }

  if (level !== undefined) {
    whereClauses.push(`e.level = $${params.length + 1}`);
    params.push(level);
  }

  if (minElo !== undefined) {
    whereClauses.push(`e.elo >= $${params.length + 1}`);
    params.push(minElo);
  }

  const query = `SELECT COUNT(*) as total FROM elo_ratings e WHERE ${whereClauses.join(" AND ")}`;
  const result = await db.query<{ total: string }>(query, params);
  return parseInt(result.rows[0].total, 10);
}

export async function findRankings(/* ... */): Promise<ClubRanking[]> {
  // SQL query here
}
```

**3. rankings.service.ts (Business Logic - 30 lines)**
```typescript
export async function getRankings(
  filters: RankingsFilters
): Promise<RankingsResponse> {
  // Determine target date
  let targetDate: string;

  if (filters.date) {
    targetDate = filters.date;
  } else {
    const latestDate = await rankingsRepo.getLatestRatingsDate();
    if (!latestDate) {
      throw new ApiError(404, "No rating data available");
    }
    targetDate = latestDate;
  }

  // Calculate pagination
  const { page, pageSize } = filters.pagination;
  const offset = (page - 1) * pageSize;

  // Count total results
  const totalResults = await rankingsRepo.countRankings(
    targetDate,
    filters.country,
    filters.level,
    filters.minElo
  );

  // Fetch rankings
  const clubs = await rankingsRepo.findRankings(targetDate, {
    country: filters.country,
    level: filters.level,
    minElo: filters.minElo,
    limit: pageSize,
    offset,
  });

  // Build response
  return {
    date: targetDate,
    country: filters.country || null,
    level: filters.level ?? null,
    minElo: filters.minElo ?? null,
    clubs,
    pagination: {
      page,
      pageSize,
      total: totalResults,
      totalPages: Math.ceil(totalResults / pageSize),
    },
  };
}
```

**4. rankings.routes.ts (HTTP Handling - 25 lines)**
```typescript
router.get(
  "/",
  validateDate("date"),      // ✅ Reusable middleware
  validatePagination,         // ✅ Reusable middleware
  asyncHandler(async (req: Request, res: Response) => {
    // Extract parameters
    const { date, country, level: levelParam, minElo: minEloParam } = req.query;

    const level = levelParam ? parseInt(levelParam as string, 10) : undefined;
    const minElo = minEloParam ? parseFloat(minEloParam as string) : undefined;

    // Build filters
    const filters: RankingsFilters = {
      date: date as string | undefined,
      country: country as string | undefined,
      level,
      minElo,
      pagination: req.pagination!, // Already validated by middleware
    };

    // Delegate to service
    const result = await rankingsService.getRankings(filters);

    // Return response
    res.json(result);
  })
);
```

**Benefits:**
- ✅ Each file has ONE responsibility
- ✅ SQL isolated in repository (easy to optimize)
- ✅ Business logic in service (easy to unit test)
- ✅ HTTP handling in routes (thin layer)
- ✅ Validation in middleware (reusable)
- ✅ No try/catch needed (asyncHandler + errorHandler middleware)
- ✅ Type-safe DTOs (contract-first)

---

## File Count Comparison

### ❌ BEFORE
```
src/
├── server.ts              (500 lines - EVERYTHING)
├── lib/
│   ├── db.ts             (50 lines)
│   ├── config.ts         (30 lines)
│   ├── clubelo-api.ts    (100 lines)
│   ├── importer.ts       (150 lines)
│   └── fixtures-importer.ts (120 lines)
└── scripts/              (3 files)

Total: ~950 lines across 9 files
```

### ✅ AFTER
```
src/
├── server-refactored.ts  (100 lines - THIN)
├── modules/
│   ├── rankings/
│   │   ├── types.ts      (60 lines)
│   │   ├── repository.ts (120 lines)
│   │   ├── service.ts    (60 lines)
│   │   ├── routes.ts     (60 lines)
│   │   └── index.ts      (20 lines)
│   ├── clubs/
│   │   ├── types.ts      (80 lines)
│   │   ├── repository.ts (140 lines)
│   │   ├── service.ts    (70 lines)
│   │   ├── routes.ts     (70 lines)
│   │   └── index.ts      (20 lines)
│   └── fixtures/
│       ├── types.ts      (80 lines)
│       ├── repository.ts (150 lines)
│       ├── service.ts    (40 lines)
│       ├── routes.ts     (60 lines)
│       └── index.ts      (20 lines)
├── shared/
│   ├── database/
│   │   ├── connection.ts (70 lines)
│   │   └── transaction.ts (30 lines)
│   ├── config/
│   │   └── environment.ts (50 lines)
│   ├── utils/
│   │   ├── date-formatter.ts (60 lines)
│   │   └── logger.ts     (40 lines)
│   ├── middleware/
│   │   ├── error-handler.ts (70 lines)
│   │   └── validation.ts (90 lines)
│   └── types/
│       └── common.types.ts (40 lines)
└── scripts/              (3 files - to be refactored)

Total: ~1500 lines across 27 files
```

**Trade-off:**
- ❌ More files (27 vs 9)
- ✅ Each file is small (<150 lines)
- ✅ Clear separation of concerns
- ✅ Easy to navigate (know exactly where to look)
- ✅ Testable in isolation

---

## Dependency Graph Comparison

### ❌ BEFORE (Tight Coupling)

```
server.ts ━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━┓
                  ┃         ┃         ┃
                  ▼         ▼         ▼
                db.ts   config.ts  clubelo-api.ts
                  ┃
                  ┃ (SQL queries scattered in server.ts)
                  ▼
              PostgreSQL

importer.ts ━━━━━━┻━━━━━━━━> db.ts (duplicate upsert logic)
fixtures-importer.ts ━━━━━━━> db.ts (duplicate upsert logic)
```

**Problems:**
- Multiple files doing similar database operations
- No clear boundaries
- Circular dependencies possible

---

### ✅ AFTER (Loose Coupling)

```
server-refactored.ts
    │
    ├─> rankingsRoutes ━━> rankingsService ━━> rankingsRepository ━┓
    │                                                                ┃
    ├─> clubsRoutes ━━━━━> clubsService ━━━━━> clubsRepository ━━━━╋━> db
    │                                                                ┃
    └─> fixturesRoutes ━━> fixturesService ━━> fixturesRepository ━┛
                                                                     
shared/
├── database/connection.ts ━━> PostgreSQL
├── middleware/validation.ts (used by all routes)
└── utils/* (used by all modules)

external-data module (TODO):
└─> clubsService.upsertClub() (via public API, NOT direct repository access)
```

**Benefits:**
- Clear uni-directional dependencies
- Modules don't know about each other
- Shared utilities used consistently
- Database access ONLY through repositories

---

## Testing Comparison

### ❌ BEFORE (Hard to Test)

```typescript
// How do you test this?
app.get("/api/elo/rankings", async (req, res) => {
  // 115 lines mixing HTTP, SQL, business logic
});

// You CAN'T easily:
// - Mock the database
// - Test business logic without HTTP
// - Test SQL queries in isolation
```

---

### ✅ AFTER (Easy to Test)

**Test 1: Repository (Mock Database)**
```typescript
describe("rankingsRepository", () => {
  it("should count rankings with filters", async () => {
    // Mock database
    const mockDb = {
      query: jest.fn().mockResolvedValue({ rows: [{ total: "42" }] })
    };

    const count = await rankingsRepo.countRankings("2024-11-20", "ENG");

    expect(count).toBe(42);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT COUNT(*)"),
      ["2024-11-20", "ENG"]
    );
  });
});
```

**Test 2: Service (Mock Repository)**
```typescript
describe("rankingsService", () => {
  it("should get latest date if not provided", async () => {
    // Mock repository
    jest.spyOn(rankingsRepo, "getLatestRatingsDate").mockResolvedValue("2024-11-20");
    jest.spyOn(rankingsRepo, "countRankings").mockResolvedValue(100);
    jest.spyOn(rankingsRepo, "findRankings").mockResolvedValue([/* mock data */]);

    const result = await rankingsService.getRankings({
      pagination: { page: 1, pageSize: 10 }
    });

    expect(result.date).toBe("2024-11-20");
    expect(rankingsRepo.getLatestRatingsDate).toHaveBeenCalled();
  });
});
```

**Test 3: Routes (Integration Test)**
```typescript
import request from "supertest";
import app from "../server-refactored";

describe("GET /api/elo/rankings", () => {
  it("should return rankings", async () => {
    const response = await request(app)
      .get("/api/elo/rankings")
      .query({ country: "ENG", limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("clubs");
    expect(response.body.clubs).toHaveLength(10);
  });
});
```

---

## Scalability Comparison

### ❌ BEFORE (Monolithic Scaling)

```
┌─────────────────────────┐
│   server.ts (500 lines) │
│   Everything together   │
└─────────────────────────┘

To scale:
- Must scale entire server
- Can't split by domain
- Can't assign teams by feature
```

---

### ✅ AFTER (Modular Scaling)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Rankings    │  │    Clubs     │  │   Fixtures   │
│  Module      │  │    Module    │  │   Module     │
└──────────────┘  └──────────────┘  └──────────────┘

Team Assignment:
- Team A: Rankings + Clubs
- Team B: Fixtures + External Data
- No conflicts (different directories)

Future Microservices (if needed):
- Extract Rankings module → rankings-service
- Extract Fixtures module → fixtures-service
- Keep Clubs as shared library
```

---

## Summary

| Aspect | BEFORE (Spaghetti) | AFTER (Modular) |
|--------|-------------------|----------------|
| **Lines per file** | 500 | <150 |
| **Concerns per file** | 5+ | 1 |
| **SQL location** | Scattered | Repositories only |
| **Business logic location** | Mixed with HTTP | Services only |
| **Testability** | Hard | Easy |
| **Team separation** | Impossible | Natural |
| **Reusability** | None | High |
| **Maintenance** | High effort | Low effort |
| **Onboarding** | Weeks | Days |

---

**The refactoring transforms 500 lines of tangled code into 27 small, focused, testable modules.**
