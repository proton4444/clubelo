# ClubElo Refactoring: Quick Reference Card

## 🚀 Getting Started

```bash
# Start the refactored server
tsx src/server-refactored.ts

# Run tests
npm test

# Build for production
npm run build
```

---

## 📁 Where Is Everything?

| What | Old Location | New Location |
|-----|-------------|--------------|
| **Server Entry Point** | `src/server.ts` | `src/server-refactored.ts` |
| **Rankings API** | `server.ts` (65-180) | `src/modules/rankings/` |
| **Clubs API** | `server.ts` (225-380) | `src/modules/clubs/` |
| **Fixtures API** | `server.ts` (385-470) | `src/modules/fixtures/` |
| **ClubElo API Client** | `lib/clubelo-api.ts` | `modules/external-data/clubelo-client.ts` |
| **Data Importer** | `lib/importer.ts` | `modules/external-data/data-importer.service.ts` |
| **Fixtures Importer** | `lib/fixtures-importer.ts` | `modules/external-data/fixtures-importer.service.ts` |
| **Database Connection** | `lib/db.ts` | `shared/database/connection.ts` |
| **Configuration** | `lib/config.ts` | `shared/config/environment.ts` |
| **Date Utilities** | Scattered | `shared/utils/date-formatter.ts` |
| **Validation Schemas** | Inline | `shared/validation/schemas.ts` |
| **Error Handling** | Scattered try/catch | `shared/middleware/error-handler.ts` |

---

## 🏗️ Module Structure

### Each Module Has (e.g., rankings)

```
src/modules/rankings/
├── types.ts              ← DTOs & Interfaces
├── repository.ts         ← SQL Queries
├── service.ts            ← Business Logic
├── routes.ts             ← HTTP Handlers
├── __tests__/            ← Unit Tests
│   ├── repository.test.ts
│   └── service.test.ts
└── index.ts              ← Public API (Barrel)
```

### What Each File Does

| File | Purpose | Example |
|------|---------|---------|
| `types.ts` | Define DTOs | `interface RankingsFilters { ... }` |
| `repository.ts` | SQL queries | `async function findRankings() { ... }` |
| `service.ts` | Business logic | `async function getRankings(filters) { ... }` |
| `routes.ts` | HTTP handling | `router.get('/', asyncHandler(...))` |
| `index.ts` | Export public API | `export * as rankingsService from ...` |

---

## ✅ Module Checklist

Before adding a new feature, verify:

- [ ] Types defined in `types.ts`
- [ ] Repository has SQL logic in `repository.ts`
- [ ] Service has business logic in `service.ts`
- [ ] Routes handle HTTP in `routes.ts`
- [ ] Tests cover all layers in `__tests__/`
- [ ] Public API exported in `index.ts`

---

## 🚫 Code Standards (STOP ME If Broken!)

### ❌ DON'T: SQL in Service Layer
```typescript
// WRONG
export async function getRankings() {
  const result = await db.query("SELECT * FROM...");  // ❌
}

// CORRECT
export async function getRankings() {
  const result = await rankingsRepo.findRankings();   // ✅
}
```

### ❌ DON'T: Business Logic in Repository
```typescript
// WRONG
export async function getTopClubs() {
  const result = await db.query("SELECT * FROM...");
  return result.filter(club => club.elo > 1900);  // ❌
}

// CORRECT - Business logic in service
export async function getTopClubs() {
  const clubs = await clubsRepo.findAllClubs();
  return clubs.filter(club => club.elo > 1900);  // ✅
}
```

### ❌ DON'T: Import Module Internals
```typescript
// WRONG
import { findRankings } from "../rankings/rankings.repository";

// CORRECT
import { rankingsService } from "../rankings";
```

### ❌ DON'T: Business Logic in routes
```typescript
// WRONG
router.get('/', async (req, res) => {
  // All business logic here ❌
});

// CORRECT
router.get('/', asyncHandler(async (req, res) => {
  const result = await rankingsService.getRankings(filters);  // ✅
  res.json(result);
}));
```

### ❌ DON'T: Forget Transactions for Multi-step Ops
```typescript
// WRONG
const id1 = await db.query("INSERT INTO...");   // Committed
const id2 = await db.query("INSERT INTO...");   // If this fails → inconsistent!

// CORRECT
await withTransaction(async () => {
  const id1 = await db.query("INSERT INTO...");
  const id2 = await db.query("INSERT INTO...");
  // Both succeed or both rollback ✅
});
```

---

## 📝 Common Tasks

### Add a New Filter to Rankings

1. **Update Type** → `modules/rankings/types.ts`
2. **Update Repository** → `modules/rankings/repository.ts`
3. **Update Service** → `modules/rankings/service.ts`
4. **Update Routes** → `modules/rankings/routes.ts`
5. **Add Schema** → `shared/validation/schemas.ts`
6. **Write Tests** → `modules/rankings/__tests__/`

### Import Data

```bash
# Via API (requires CRON_SECRET)
curl -X POST http://localhost:3001/api/cron/import-daily?date=2024-11-20 \
  -H "Authorization: Bearer $CRON_SECRET"

# Programmatically
import { clubeloClient, dataImporter } from './modules/external-data';
const rows = await clubeloClient.fetchDailySnapshot('2024-11-20');
const stats = await dataImporter.importDailySnapshot(rows, new Date());
```

### Add a New Endpoint

1. **Add Route** → `module/routes.ts`
2. **Add Service** → `module/service.ts` 
3. **Add Repository** → `module/repository.ts` (if needs DB)
4. **Add Tests** → `module/__tests__/`
5. **Export** → `module/index.ts`

---

## 🧪 Testing Commands

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test
npm test -- rankings

# Verbose output
npm test -- --verbose

# Update snapshots
npm test -- --updateSnapshot
```

---

## 🔍 Debugging

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check logs (if running server)
# Look for: error, ERROR, Failed, failed

# Check database
psql $DATABASE_URL
SELECT COUNT(*) FROM elo_ratings;

# Check what's exported from a module
# Look at module/index.ts to see public API
```

---

## 📊 API Endpoints

```bash
# Health check
GET /health

# Rankings
GET /api/elo/rankings?country=ENG&level=1&page=1&pageSize=20

# Clubs search
GET /api/elo/clubs?q=Man&country=ENG&limit=10

# Club history
GET /api/elo/clubs/1/history?from=2024-01-01&to=2024-12-31
GET /api/elo/clubs/ManCity/history

# Fixtures
GET /api/elo/fixtures?date=2024-11-25&country=ENG&limit=20

# Cron (protected)
POST /api/cron/import-daily?date=2024-11-20
  -H "Authorization: Bearer $CRON_SECRET"

POST /api/cron/import-fixtures
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🔄 Dependency Direction

✅ **Correct:**
```
Routes → Services → Repositories → Database
```

❌ **Incorrect:**
```
Repositories → Services → Routes (wrong direction!)
Routes → Repositories (bypass service!)
Database → Everything (tight coupling!)
```

---

## 📋 File Naming Conventions

```
module/
├── types.ts                    ← Always: *types.ts
├── repository.ts               ← Always: *.repository.ts
├── service.ts                  ← Always: *.service.ts
├── routes.ts                   ← Always: *.routes.ts
├── __tests__/
│   ├── repository.test.ts      ← Always: *.test.ts
│   └── service.test.ts         ← Always: *.test.ts
└── index.ts                    ← Always: index.ts (barrel)
```

---

## 🎯 Code Review Checklist

When reviewing code, ask:

- [ ] Is SQL in repositories only?
- [ ] Is business logic in services only?
- [ ] Are HTTP concerns in routes only?
- [ ] Are tests included?
- [ ] Are types defined properly?
- [ ] Are DTOs used for inter-module communication?
- [ ] Are errors handled properly?
- [ ] Is there a transaction wrapper for multi-step ops?
- [ ] Are shared utilities used (not duplicated)?
- [ ] Is the module public API exported correctly?

---

## 🚀 Deployment Checklist

```bash
# Before deploying:
npm test                  # ← Tests pass?
npx tsc --noEmit         # ← No TypeScript errors?
npm run build             # ← Build succeeds?

# Deploy:
NODE_ENV=production node dist/server-refactored.js

# After deploying:
curl http://localhost:3001/health           # Health check
curl http://localhost:3001/api/elo/rankings # Test endpoint
tail -f /var/log/app.log                    # Monitor logs
```

---

## 💡 Pro Tips

1. **Use barrel files** - Only import from `index.ts`
2. **Keep files small** - Easier to understand
3. **Write tests** - They catch bugs early
4. **Use types** - TypeScript catches errors
5. **Centralize utilities** - Don't duplicate code
6. **Separate concerns** - Each file has one job
7. **Use transactions** - For multi-step operations
8. **Document APIs** - Types + JSDoc comments

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **Server won't start** | Check `npx tsc --noEmit` for errors |
| **Tests fail** | Run `npm test -- --verbose` for details |
| **Can't find module** | Check barrel file exports (`index.ts`) |
| **Database error** | Check `DATABASE_URL` env variable |
| **Type errors** | Read the error message carefully |
| **API returns wrong data** | Check if filter is working in repository |

---

## 📞 Quick Links

- **Start here:** `README_REFACTORING.md`
- **Getting started:** `QUICK_START_REFACTORED.md`
- **How to test:** `TESTING_GUIDE.md`
- **Architecture details:** `ARCHITECTURE_COMPARISON.md`
- **Full plan:** `REFACTORING_PLAN.md`

---

## ✅ Quick Verification

```bash
# Everything should pass:
npx tsc --noEmit        # ✅ No errors
npm test                # ✅ All pass
curl http://localhost:3001/health  # ✅ 200 OK
```

---

**Keep this card handy! Reference it when developing.** 🚀
