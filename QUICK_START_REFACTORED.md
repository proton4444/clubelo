# Quick Start Guide - Refactored ClubElo

## 🚀 Getting Started

### Start the Refactored Server

```bash
# Install dependencies (if not done)
npm install

# Start refactored server
tsx src/server-refactored.ts

# Or add to package.json and use:
npm run dev:refactored
```

Server will start on `http://localhost:3001`

---

## 📁 Project Structure

```
src/
├── server-refactored.ts          ← NEW: Clean server entry point
│
├── modules/                      ← NEW: Domain-driven modules
│   ├── rankings/                 → Club rankings
│   ├── clubs/                    → Clubs management
│   ├── fixtures/                 → Match fixtures
│   └── external-data/            → ClubElo API integration
│
├── shared/                       ← NEW: Shared utilities
│   ├── database/                 → Connection, transactions
│   ├── utils/                    → Date, logging
│   ├── middleware/               → Error handling, validation
│   ├── validation/               → Zod schemas
│   └── types/                    → Common DTOs
│
└── lib/                          ← OLD: To be deprecated
    ├── db.ts                     → Use shared/database/connection.ts
    ├── config.ts                 → Use shared/config/environment.ts
    ├── clubelo-api.ts            → Use modules/external-data/clubelo-client.ts
    └── importer.ts               → Use modules/external-data/data-importer.service.ts
```

---

## 🔍 Where to Find Things

| What you need | Old location | New location |
|---------------|-------------|--------------|
| **Database connection** | `lib/db.ts` | `shared/database/connection.ts` |
| **Configuration** | `lib/config.ts` | `shared/config/environment.ts` |
| **Rankings API** | `server.ts` lines 65-180 | `modules/rankings/` |
| **Clubs API** | `server.ts` lines 225-380 | `modules/clubs/` |
| **Fixtures API** | `server.ts` lines 385-470 | `modules/fixtures/` |
| **Import logic** | `lib/importer.ts` | `modules/external-data/` |
| **Date utilities** | Scattered in multiple files | `shared/utils/date-formatter.ts` |
| **Validation** | Inline in each route | `shared/validation/schemas.ts` |
| **Error handling** | Try/catch everywhere | `shared/middleware/error-handler.ts` |

---

## 🧪 Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test rankings.repository.test
```

---

## 🛠️ Common Tasks

### Add a New Filter to Rankings

**1. Update DTO:**
```typescript
// modules/rankings/rankings.types.ts
export interface RankingsFilters {
  // ... existing filters
  newFilter?: string; // Add new filter
}
```

**2. Update Repository:**
```typescript
// modules/rankings/rankings.repository.ts
export async function findRankings(date: string, options: { ..., newFilter?: string }) {
  if (options.newFilter) {
    whereClauses.push(`e.new_column = $${params.length + 1}`);
    params.push(options.newFilter);
  }
}
```

**3. Update Service:**
```typescript
// modules/rankings/rankings.service.ts
export async function getRankings(filters: RankingsFilters) {
  const clubs = await rankingsRepo.findRankings(targetDate, {
    // ... existing options
    newFilter: filters.newFilter,
  });
}
```

**4. Update Routes:**
```typescript
// modules/rankings/rankings.routes.ts
const { newFilter } = req.query;
const filters: RankingsFilters = {
  // ... existing filters
  newFilter: newFilter as string | undefined,
};
```

**5. Add Validation (Optional):**
```typescript
// shared/validation/schemas.ts
export const rankingsFiltersSchema = z.object({
  // ... existing fields
  newFilter: z.string().optional(),
});
```

**6. Write Tests:**
```typescript
// modules/rankings/__tests__/rankings.repository.test.ts
it('should filter by newFilter', async () => {
  // ... test implementation
});
```

---

### Import Data from ClubElo

**Manual Import:**
```bash
# Import daily snapshot
curl -X POST http://localhost:3001/api/cron/import-daily?date=2024-11-20 \
  -H "Authorization: Bearer your_cron_secret"

# Import fixtures
curl -X POST http://localhost:3001/api/cron/import-fixtures \
  -H "Authorization: Bearer your_cron_secret"
```

**Programmatic Usage:**
```typescript
import { clubeloClient, dataImporter } from './modules/external-data';

// Fetch and import daily data
const rows = await clubeloClient.fetchDailySnapshot('2024-11-20');
const stats = await dataImporter.importDailySnapshot(rows, new Date('2024-11-20'));
console.log(`Imported ${stats.success} clubs, ${stats.errors} errors`);
```

---

### Add a New Endpoint

**1. Add Route to Module:**
```typescript
// modules/rankings/rankings.routes.ts
router.get('/new-endpoint', asyncHandler(async (req, res) => {
  const result = await rankingsService.newFunction();
  res.json(result);
}));
```

**2. Implement Service:**
```typescript
// modules/rankings/rankings.service.ts
export async function newFunction() {
  // Business logic here
  const data = await rankingsRepo.newQuery();
  return data;
}
```

**3. Add Repository Query:**
```typescript
// modules/rankings/rankings.repository.ts
export async function newQuery() {
  const result = await db.query('SELECT ...');
  return result.rows.map(mapRowToDTO);
}
```

**4. Export from Barrel:**
```typescript
// modules/rankings/index.ts
export * as rankingsService from './rankings.service'; // Already exported
```

**5. Write Tests:**
```typescript
// modules/rankings/__tests__/rankings.service.test.ts
describe('newFunction', () => {
  it('should return expected data', async () => {
    // ... test implementation
  });
});
```

---

## 🐛 Debugging

### Enable Debug Logging

```bash
# In .env
NODE_ENV=development

# Logger will output debug messages
```

### Check Database Queries

```typescript
// The db.query function logs slow queries (>1s) automatically
// in development mode
```

### Test a Single Module

```bash
# Test only rankings module
npm test -- rankings

# Test specific file
npm test -- rankings.repository.test
```

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/elo/rankings` | GET | Get club rankings |
| `/api/elo/clubs` | GET | Search clubs |
| `/api/elo/clubs/:id/history` | GET | Get club Elo history |
| `/api/elo/fixtures` | GET | Get match fixtures |
| `/api/cron/import-daily` | POST | Import daily snapshot (protected) |
| `/api/cron/import-fixtures` | POST | Import fixtures (protected) |

**API Documentation:** `http://localhost:3001/api/docs` (development only)

---

## 🚨 Common Pitfalls

### ❌ DON'T: Import from Module Internals
```typescript
// WRONG
import { findRankings } from '../rankings/rankings.repository';

// CORRECT
import { rankingsService } from '../rankings';
```

### ❌ DON'T: Put SQL in Service Layer
```typescript
// WRONG - service.ts
export async function getRankings() {
  const result = await db.query('SELECT * FROM ...');
}

// CORRECT - repository.ts
export async function findRankings() {
  const result = await db.query('SELECT * FROM ...');
}
```

### ❌ DON'T: Put Business Logic in Repository
```typescript
// WRONG - repository.ts
export async function getTopClubs() {
  const result = await db.query('SELECT * FROM ...');
  return result.filter(club => club.elo > 1900); // Business logic!
}

// CORRECT - service.ts
export async function getTopClubs() {
  const clubs = await repository.findAllClubs();
  return clubs.filter(club => club.elo > 1900); // Business logic here
}
```

### ❌ DON'T: Skip Transactions for Multi-Step Operations
```typescript
// WRONG
const id1 = await db.query('INSERT INTO table1 ...');
const id2 = await db.query('INSERT INTO table2 ...'); // If this fails, table1 is inconsistent!

// CORRECT
await withTransaction(async (client) => {
  const id1 = await client.query('INSERT INTO table1 ...');
  const id2 = await client.query('INSERT INTO table2 ...');
  // Both succeed or both rollback
});
```

---

## 🎯 Key Principles

1. **Repository** = SQL queries ONLY
2. **Service** = Business logic ONLY
3. **Routes** = HTTP handling ONLY
4. **Shared** = Domain-agnostic utilities ONLY
5. **Modules** = Communicate via barrel files (index.ts) ONLY

---

## 📖 Further Reading

- `REFACTORING_PLAN.md` - Full refactoring strategy
- `ARCHITECTURE_COMPARISON.md` - Before/After code examples
- `PHASE_2_COMPLETE.md` - Phase 2 summary

---

## 🆘 Need Help?

**Common Questions:**

**Q: Which server should I use?**
A: Use `server-refactored.ts` for new development. The old `server.ts` is kept for reference.

**Q: Where do I add new business logic?**
A: In the appropriate module's `service.ts` file.

**Q: How do I add a new database query?**
A: In the appropriate module's `repository.ts` file.

**Q: Can modules talk to each other?**
A: Yes, but only via their public API (barrel file). Never import internals directly.

**Q: Do I need to update the old server.ts?**
A: No. All new features go in the refactored modules. The old file will be deprecated.

---

**Happy coding! 🚀**
