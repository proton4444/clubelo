# ClubElo Refactoring Plan: Spaghetti Monolith → Modular Monolith

## 🎯 Objective

Transform the ClubElo codebase from a tightly coupled monolith into a **Modular Monolith** using the **Strangler Fig Pattern**, enabling:
- Team separation (frontend/backend teams can work independently)
- Easier scaling (modules can be extracted to microservices later)
- Maintainability (clear boundaries, no spaghetti code)

---

## 📊 Before & After Comparison

### ❌ BEFORE (Current server.ts)

```typescript
// 500+ lines, everything in one file
server.ts
├── Imports & middleware
├── formatDateOnly() utility (should be shared)
├── GET /health
├── GET /api/elo/rankings
│   ├── Parameter parsing (50 lines)
│   ├── Pagination logic (20 lines)
│   ├── SQL query construction (40 lines)
│   ├── Database queries (2 queries)
│   └── Response transformation (20 lines)
├── GET /api/elo/clubs/:id/history
│   ├── Similar pattern: 80 lines
├── GET /api/elo/clubs
│   ├── Similar pattern: 60 lines
├── GET /api/elo/fixtures
│   ├── Similar pattern: 100 lines
├── POST /api/cron/import-daily
│   ├── Auth validation inline
│   ├── Import orchestration
└── Server startup
```

**Problems:**
- SQL queries scattered throughout
- Business logic mixed with HTTP handling
- No separation of concerns
- Impossible to unit test individual layers
- Duplicate validation logic

---

### ✅ AFTER (New server-refactored.ts)

```typescript
// 100 lines, thin orchestration only
server-refactored.ts
├── Imports
├── Middleware setup
├── GET /health
├── app.use("/api/elo/rankings", rankingsRoutes)  // Delegated
├── app.use("/api/elo/clubs", clubsRoutes)        // Delegated
├── app.use("/api/elo/fixtures", fixturesRoutes)  // Delegated
├── Error handler
└── Server startup

// Each module follows: Repository → Service → Routes
src/modules/rankings/
├── rankings.types.ts       // DTOs (Contract)
├── rankings.repository.ts  // SQL queries ONLY
├── rankings.service.ts     // Business logic ONLY
├── rankings.routes.ts      // HTTP handling ONLY
└── index.ts                // Public API (Barrel file)
```

**Benefits:**
- Clear boundaries between layers
- Each file has ONE responsibility
- Easy to unit test (mock repository in service tests)
- SQL queries isolated in repositories
- Shared utilities extracted

---

## 🏗️ New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Frontend - To be refactored next)     │
│  ├─ Will consume the same API endpoints                     │
│  └─ No changes needed immediately                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTP Requests
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  API LAYER (server-refactored.ts - Thin orchestration)      │
│  ├─ Middleware pipeline                                      │
│  ├─ Error handling (centralized)                             │
│  └─ Route mounting (delegates to modules)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    Delegates to modules
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐  ┌─────────▼────────┐  ┌──────▼────────┐
│  Rankings    │  │     Clubs         │  │   Fixtures    │
│  Module      │  │     Module        │  │   Module      │
├──────────────┤  ├───────────────────┤  ├───────────────┤
│ routes.ts    │  │ routes.ts         │  │ routes.ts     │
│ service.ts   │  │ service.ts        │  │ service.ts    │
│ repository.ts│  │ repository.ts     │  │ repository.ts │
│ types.ts     │  │ types.ts          │  │ types.ts      │
│ index.ts     │  │ index.ts          │  │ index.ts      │
└──────┬───────┘  └─────────┬─────────┘  └───────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    Shared database connection
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  SHARED LAYER (No business logic)                           │
│  ├─ database/ (connection, transaction)                     │
│  ├─ utils/ (date-formatter, logger)                         │
│  ├─ config/ (environment)                                    │
│  └─ middleware/ (error-handler, validation)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    PostgreSQL Pool
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  DATABASE LAYER                                              │
│  ├─ PostgreSQL 14+                                           │
│  ├─ clubs, elo_ratings, fixtures tables                     │
│  └─ Schema unchanged (no breaking changes)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 What Has Been Built

### ✅ Phase 1: Structure & Boundaries (COMPLETED)

**Created:**
1. **Module Structure**
   - `src/modules/rankings/` - Club rankings domain
   - `src/modules/clubs/` - Clubs domain
   - `src/modules/fixtures/` - Match fixtures domain

2. **Shared Utilities** (NOT business logic)
   - `src/shared/database/connection.ts` - Database pool singleton
   - `src/shared/database/transaction.ts` - Transaction wrapper
   - `src/shared/config/environment.ts` - Configuration
   - `src/shared/utils/date-formatter.ts` - Date utilities
   - `src/shared/utils/logger.ts` - Centralized logging
   - `src/shared/middleware/error-handler.ts` - Error handling
   - `src/shared/middleware/validation.ts` - Request validation

3. **Type Contracts (DTOs)**
   - `src/shared/types/common.types.ts` - Shared types
   - `src/modules/*/types.ts` - Module-specific DTOs

4. **Each Module Follows: Repository → Service → Routes**
   - `*.repository.ts` - SQL queries ONLY (data access)
   - `*.service.ts` - Business logic ONLY (orchestration)
   - `*.routes.ts` - HTTP handling ONLY (request/response)
   - `index.ts` - Public API (barrel file pattern)

5. **New Server**
   - `src/server-refactored.ts` - Clean, modular server (<100 lines)

**Key Improvements:**
- ✅ No SQL in route handlers
- ✅ No business logic in repositories
- ✅ Centralized error handling
- ✅ Reusable validation middleware
- ✅ Transaction support (fixes fixtures-importer bug)
- ✅ Proper separation of concerns

---

## 🚀 Next Steps (Strangler Fig Pattern)

### Phase 2: Backend Decoupling (NEXT)

**Tasks:**
1. **Create external-data module**
   - Move `src/lib/clubelo-api.ts` → `src/modules/external-data/clubelo-client.ts`
   - Move `src/lib/importer.ts` → `src/modules/external-data/data-importer.service.ts`
   - Move `src/lib/fixtures-importer.ts` → use new fixtures module
   - Add cron routes to handle `/api/cron/*` endpoints

2. **Add validation with Zod**
   - Install Zod: `npm install zod`
   - Create validation schemas for all DTOs
   - Replace manual validation in middleware

3. **Update scripts to use modules**
   - `src/scripts/import-daily.ts` → use external-data module
   - `src/scripts/import-club.ts` → use clubs/rankings modules
   - `src/scripts/import-fixtures.ts` → use fixtures module

4. **Add comprehensive tests**
   - Repository tests (mock database)
   - Service tests (mock repository)
   - Route tests (integration tests)

5. **Cutover to refactored server**
   - Test `server-refactored.ts` thoroughly
   - Update `package.json` dev script: `tsx src/server-refactored.ts`
   - Deprecate old `server.ts` (rename to `server-legacy.ts`)

---

### Phase 3: Frontend Isolation (LATER)

**Identify the problem:**
- 5 duplicate dashboard implementations
- Mixed concerns (fetching + transforming + rendering)
- No component abstraction

**Solution:**
1. **Consolidate frontends**
   - Keep ONLY `dashboard-full.js` (most feature-complete)
   - Delete `dashboard.js`, `command-center.js`, `minimalist.js`
   - Keep `rankings.js`, `club.js`, `country-page.js` as separate pages

2. **Extract UI utilities**
   - `public/js/utils/flags.js` - Country flag emoji mapping
   - `public/js/utils/logos.js` - Club logo URL mapping
   - `public/js/utils/charts.js` - Chart.js wrapper

3. **Split components**
   - Container components (fetch data)
   - Presentational components (render UI)

4. **Example refactoring:**
   ```javascript
   // BEFORE (dashboard-full.js)
   async function loadAllData() {
     const response = await fetch("/api/elo/rankings?limit=100");
     const data = await response.json();
     clubsData = data.clubs || [];
     countryData = calculateCountryAverages(clubsData);
     renderCountries();
   }

   // AFTER (split into 3 files)
   // services/rankings-service.js
   async function fetchRankings(filters) {
     const response = await fetch(`/api/elo/rankings?${new URLSearchParams(filters)}`);
     return response.json();
   }

   // business/country-aggregator.js
   function calculateCountryAverages(clubs) { ... }

   // components/country-list.js
   function renderCountries(countries, containerId) { ... }

   // pages/dashboard.js (Container)
   async function initDashboard() {
     const data = await fetchRankings({ limit: 100 });
     const countries = calculateCountryAverages(data.clubs);
     renderCountries(countries, "countries-list");
   }
   ```

---

### Phase 4: Database Safety (ONGOING)

**Principles to follow:**
- ✅ **Expand-Contract Pattern** for schema changes
  1. Add new column (nullable)
  2. Write to both old & new columns
  3. Backfill data
  4. Read from new column
  5. Deprecate old column

- ✅ **Never delete columns on live tables**
  - Mark as deprecated first
  - Monitor for usage
  - Drop after cooldown period

- ✅ **Use transactions for multi-step operations**
  - Already implemented in `src/shared/database/transaction.ts`
  - Use `withTransaction()` helper

---

## 🔍 How to Verify the Refactoring

### 1. Test the new server

```bash
# Start the refactored server
npm run dev:refactored

# Test endpoints (should work identically)
curl http://localhost:3001/health
curl http://localhost:3001/api/elo/rankings?limit=10
curl http://localhost:3001/api/elo/clubs?q=Man
curl http://localhost:3001/api/elo/clubs/1/history
curl http://localhost:3001/api/elo/fixtures?date=2025-11-20
```

### 2. Compare responses

Both `server.ts` and `server-refactored.ts` should return identical JSON.

### 3. Run existing tests

```bash
npm test
```

Tests should pass without modification (API contract unchanged).

---

## 📚 Key Architectural Decisions

### Decision 1: Repository Pattern Over ORM

**Rationale:**
- You already use raw SQL (Prisma schema exists but unused)
- Repository pattern provides:
  - SQL query isolation
  - Easy to optimize queries
  - No ORM overhead
  - Full control over database access

**Trade-off:**
- More manual SQL writing
- No automatic migrations (you have `.sql` files)

### Decision 2: Barrel Files (index.ts)

**Rationale:**
- Enforce module boundaries
- Only expose public API
- Easy to refactor internals without breaking other modules

**Example:**
```typescript
// Other modules can ONLY do this:
import { rankingsService } from "./modules/rankings";

// They CANNOT do this (repository is private):
import { findRankings } from "./modules/rankings/rankings.repository"; // ❌
```

### Decision 3: No Cross-Module Direct Imports

**Rationale:**
- Modules communicate via DTOs/interfaces
- Prevents tight coupling
- Enables future extraction to microservices

**Exception:**
- `clubs` module exports `upsertClub` repository function
- Reason: `external-data` module needs to upsert clubs during import
- This is controlled via barrel file (explicit export)

### Decision 4: Shared Utilities, Not Shared Business Logic

**What goes in `/shared`:**
- ✅ Database connection
- ✅ Date formatting
- ✅ Logging
- ✅ Error handling
- ✅ Configuration

**What does NOT go in `/shared`:**
- ❌ Club ranking calculations
- ❌ Elo rating logic
- ❌ Fixture predictions
- ❌ Import orchestration

**Rationale:**
- Business logic belongs in domain modules
- Shared utilities are domain-agnostic

---

## 🎓 Learning: How This Prevents "Spaghetti Monolith"

### Problem 1: "I need to add a new filter to rankings"

**Before (Spaghetti):**
1. Edit `server.ts` line 85
2. Add parameter parsing logic
3. Add WHERE clause construction
4. Add validation
5. Risk breaking other endpoints (shared utility functions)

**After (Modular):**
1. Edit `rankings.repository.ts` → add filter to SQL query
2. Edit `rankings.service.ts` → add filter parameter
3. Edit `rankings.routes.ts` → extract query param
4. Edit `rankings.types.ts` → update DTO
5. No risk to other modules (isolated change)

### Problem 2: "I need to optimize a slow query"

**Before (Spaghetti):**
1. Find the query (search through 500 lines of `server.ts`)
2. Hope you don't break the WHERE clause logic
3. No way to unit test the query independently

**After (Modular):**
1. Open `rankings.repository.ts`
2. Find the exact query function
3. Optimize SQL
4. Write repository test with mock database
5. Verify via service layer tests

### Problem 3: "I want to change the response format"

**Before (Spaghetti):**
1. Edit transformation logic in `server.ts`
2. Risk breaking frontend (no clear contract)
3. No type safety

**After (Modular):**
1. Edit DTO in `rankings.types.ts`
2. TypeScript shows all affected code
3. Update transformation in `rankings.repository.ts`
4. Frontend uses the same endpoint (no breaking change)

---

## 🛡️ Enforcement Rules

### STOP ME if I try to:

1. ❌ **Put SQL in service layer**
   ```typescript
   // WRONG
   export async function getRankings() {
     const result = await db.query("SELECT * FROM elo_ratings");
   }
   ```

2. ❌ **Put business logic in repository**
   ```typescript
   // WRONG
   export async function findTopClubs() {
     const result = await db.query("SELECT * FROM clubs");
     return result.rows.filter(club => club.elo > 1900); // Business logic!
   }
   ```

3. ❌ **Import from another module's internals**
   ```typescript
   // WRONG
   import { findRankings } from "../rankings/rankings.repository";
   
   // CORRECT
   import { rankingsService } from "../rankings";
   ```

4. ❌ **Put domain logic in /shared**
   ```typescript
   // WRONG: /shared/utils/club-scoring.ts
   export function calculateClubRank(elo: number) { ... }
   
   // CORRECT: /modules/rankings/ranking-calculator.ts
   ```

---

## 📅 Timeline

- **Week 1 (DONE):** Phase 1 - Structure & Boundaries
- **Week 2:** Phase 2 - Backend Decoupling (external-data module, tests)
- **Week 3:** Phase 2 - Cutover to refactored server
- **Week 4:** Phase 3 - Frontend consolidation & isolation
- **Week 5+:** Ongoing refinement & optimization

---

## ✅ Success Criteria

**You'll know the refactoring succeeded when:**

1. ✅ Each module can be understood in isolation
2. ✅ New features can be added without touching other modules
3. ✅ Unit tests cover repositories and services independently
4. ✅ SQL queries are in ONE place per domain
5. ✅ Frontend has no duplicate dashboard implementations
6. ✅ Team members can work on different modules without conflicts

---

## 🚨 What NOT to Do

**Avoid these anti-patterns:**

1. ❌ Creating a "helpers" or "utils" module for business logic
2. ❌ Putting shared DTOs in modules (use `/shared/types` instead)
3. ❌ Skipping the service layer ("routes can call repository directly!")
4. ❌ Adding "manager" or "helper" classes (use services)
5. ❌ Creating circular dependencies between modules

---

**Next Action:** Review this plan and let me know if you want to proceed with Phase 2!
