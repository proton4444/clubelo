# Testing Guide: Refactored Server

This guide will help you verify that the refactored server (`server-refactored.ts`) works identically to the old server (`server.ts`).

---

## 📋 Pre-Testing Checklist

- [ ] Both servers can start without errors
- [ ] Database is accessible and populated with test data
- [ ] Environment variables are set up (especially `CRON_SECRET` for cron tests)
- [ ] Node.js and npm are working

---

## 🚀 Step 1: Verify Compilation

Before running either server, make sure TypeScript compiles without errors:

```bash
cd C:\knosso\clubelo

# Check for TypeScript errors
npx tsc --noEmit

# Expected output: No errors (exit code 0)
```

✅ **Expected Result:** No compilation errors

---

## 🧪 Step 2: Run Unit Tests

Run the comprehensive test suite to verify the refactored code:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run specific test file
npm test rankings.repository.test
```

**What gets tested:**
- Repository layer (SQL queries, data transformation)
- Service layer (business logic, orchestration)
- Route layer (HTTP request/response)
- Error handling
- Pagination
- Filtering
- Date formatting

✅ **Expected Result:** All tests pass with high coverage (90%+)

---

## 🌐 Step 3: Start Both Servers

Run both servers in separate terminals to compare their behavior.

### Terminal 1: Old Server

```bash
cd C:\knosso\clubelo
npm run dev

# Output should show:
# 🚀 ClubElo API server running on http://localhost:3001
# Available endpoints:
#   GET  /health
#   ...
```

### Terminal 2: Refactored Server

```bash
cd C:\knosso\clubelo
tsx src/server-refactored.ts

# Output should show:
# 🚀 ClubElo API server running on http://localhost:3001
# ...
```

⚠️ **Note:** Both servers will try to use port 3001. Start them one at a time, testing each before starting the next.

---

## 📡 Step 4: Test API Endpoints

Use these curl commands to test each endpoint. Compare responses between old and new servers.

### Test 1: Health Check

**Old Server:**
```bash
curl http://localhost:3001/health
```

**Refactored Server:**
```bash
curl http://localhost:3001/health
```

**Expected Response (both):**
```json
{
  "status": "ok",
  "timestamp": "2024-11-24T10:30:45.123Z"
}
```

✅ **Verification:** Timestamps are different, but both should have `status: "ok"`

---

### Test 2: Get Rankings (Default Pagination)

**Request:**
```bash
curl "http://localhost:3001/api/elo/rankings"
```

**Expected Response Structure:**
```json
{
  "date": "2024-11-20",
  "country": null,
  "level": null,
  "minElo": null,
  "clubs": [
    {
      "id": 1,
      "apiName": "ManCity",
      "displayName": "Manchester City",
      "country": "ENG",
      "level": 1,
      "rank": 1,
      "elo": 1997.5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 100,
    "total": 150,
    "totalPages": 2
  }
}
```

✅ **Verification:** 
- Both servers return identical response structure
- Date is the latest available
- Clubs array is populated
- Pagination metadata is correct

---

### Test 3: Get Rankings with Filters

**Request:**
```bash
curl "http://localhost:3001/api/elo/rankings?country=ENG&level=1&page=1&pageSize=20"
```

**Expected Response:**
- Only English (ENG) clubs at level 1
- 20 results per page
- Total count reflects filter

✅ **Verification:** Both servers return the same filtered results

---

### Test 4: Get Rankings with Invalid Pagination

**Request:**
```bash
curl "http://localhost:3001/api/elo/rankings?page=0"
```

**Expected Response (both):**
```json
{
  "error": "Page must be >= 1"
}
```

✅ **Verification:** Both return 400 status code and error message

---

### Test 5: Search Clubs by Name

**Request:**
```bash
curl "http://localhost:3001/api/elo/clubs?q=Man"
```

**Expected Response:**
```json
{
  "clubs": [
    {
      "id": 1,
      "apiName": "ManCity",
      "displayName": "Manchester City",
      "country": "ENG",
      "level": 1
    },
    {
      "id": 2,
      "apiName": "ManUtd",
      "displayName": "Manchester United",
      "country": "ENG",
      "level": 1
    }
  ]
}
```

✅ **Verification:** Both servers return clubs matching "Man"

---

### Test 6: Get Club History

**Request:**
```bash
curl "http://localhost:3001/api/elo/clubs/1/history?from=2024-11-01&to=2024-11-30"
```

**Expected Response:**
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
    {
      "date": "2024-11-01",
      "elo": 1985.5,
      "rank": 2
    },
    {
      "date": "2024-11-02",
      "elo": 1997.5,
      "rank": 1
    }
  ]
}
```

✅ **Verification:** Both servers return identical club history

---

### Test 7: Get Club by API Name

**Request:**
```bash
curl "http://localhost:3001/api/elo/clubs/ManCity/history"
```

**Expected Response:** Same as Test 6, but found by API name instead of ID

✅ **Verification:** Both servers support both ID and API name lookups

---

### Test 8: Get Non-existent Club

**Request:**
```bash
curl "http://localhost:3001/api/elo/clubs/99999/history"
```

**Expected Response (both):**
```json
{
  "error": "Club not found"
}
```

Status Code: 404

✅ **Verification:** Both return 404 with "Club not found" error

---

### Test 9: Get Fixtures

**Request:**
```bash
curl "http://localhost:3001/api/elo/fixtures?country=ENG&limit=5"
```

**Expected Response:**
```json
{
  "fixtures": [
    {
      "id": 1,
      "matchDate": "2024-11-25",
      "homeTeam": {
        "id": 1,
        "name": "Manchester City",
        "country": "ENG",
        "elo": 1997.5
      },
      "awayTeam": {
        "id": 2,
        "name": "Liverpool",
        "country": "ENG",
        "elo": 1972.1
      },
      "country": "ENG",
      "competition": "Premier League",
      "predictions": {
        "homeWin": 0.45,
        "draw": 0.28,
        "awayWin": 0.27
      }
    }
  ]
}
```

✅ **Verification:** Both servers return fixtures with predictions

---

### Test 10: 404 Error

**Request:**
```bash
curl "http://localhost:3001/api/non-existent"
```

**Expected Response (both):**
```json
{
  "error": "Not found"
}
```

Status Code: 404

✅ **Verification:** Both handle non-existent routes properly

---

## 🔐 Step 5: Test Cron Endpoints

These endpoints are protected by `CRON_SECRET`. Set it first:

```bash
# In PowerShell
$env:CRON_SECRET = "test-secret"

# Or in .env file
CRON_SECRET=test-secret
```

### Test Cron: Import Daily

**Request:**
```bash
curl -X POST "http://localhost:3001/api/cron/import-daily?date=2024-11-20" \
  -H "Authorization: Bearer test-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "date": "2024-11-20",
  "fetched": 630,
  "imported": 630,
  "errors": 0
}
```

✅ **Verification:** Both servers successfully import data

### Test Cron: Missing Secret

**Request:**
```bash
curl -X POST "http://localhost:3001/api/cron/import-daily"
```

**Expected Response (both):**
```json
{
  "error": "Unauthorized"
}
```

Status Code: 401

✅ **Verification:** Both enforce cron secret authentication

---

## 📊 Step 6: Performance Comparison

Run these tests to compare performance:

```bash
# Test with Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:3001/api/elo/rankings

# Test with wrk (if installed)
wrk -t4 -c100 -d30s http://localhost:3001/api/elo/rankings
```

**What to look for:**
- Old server: baseline performance
- Refactored server: should be similar or better (no overhead added)
- No significant differences in response times

---

## ✅ Comprehensive Test Checklist

- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] Health check works on both servers
- [ ] Rankings endpoint works with default pagination
- [ ] Rankings endpoint works with filters
- [ ] Rankings endpoint rejects invalid pagination
- [ ] Club search works
- [ ] Club history retrieval works
- [ ] Club lookup by ID works
- [ ] Club lookup by API name works
- [ ] Non-existent club returns 404
- [ ] Fixtures endpoint works
- [ ] 404 handler works
- [ ] Cron endpoints require authentication
- [ ] Cron endpoints import data successfully
- [ ] Performance is acceptable
- [ ] Error handling is consistent
- [ ] Response formats match

---

## 🐛 Debugging Tips

### Server Won't Start

```bash
# Check if port 3001 is already in use
netstat -ano | findstr :3001

# Check for TypeScript errors
npx tsc --noEmit

# Check environment variables
echo %DATABASE_URL%
echo %CRON_SECRET%
```

### Tests Fail

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- rankings.repository.test

# Check for database connection issues
npm test -- --detectOpenHandles
```

### API Returns Wrong Data

```bash
# Check database directly
psql $DATABASE_URL
SELECT COUNT(*) FROM elo_ratings;
SELECT COUNT(*) FROM clubs;
SELECT COUNT(*) FROM fixtures;

# Check logs
NODE_ENV=development npm run dev:refactored
```

### Responses Don't Match

1. Check if database data changed between requests
2. Verify timestamps (will be different, that's OK)
3. Compare array lengths (should be identical)
4. Compare response structure (should be identical)

---

## 📝 Test Report Template

Use this template to document your testing results:

```markdown
# Testing Report: Refactored Server

## Date: [DATE]
## Tester: [NAME]

## Test Environment
- Node.js Version: [VERSION]
- Database: PostgreSQL [VERSION]
- Environment: [DEV/STAGING/PRODUCTION]

## Test Results

### Unit Tests
- Total Tests: [ ]
- Passed: [ ]
- Failed: [ ]
- Coverage: [ ]%

### API Endpoint Tests
| Endpoint | Old Server | Refactored | Match? |
|----------|-----------|-----------|--------|
| GET /health | ✓ | ✓ | ✓ |
| GET /api/elo/rankings | ✓ | ✓ | ✓ |
| ... | | | |

### Performance Tests
| Test | Old Server | Refactored | Difference |
|------|-----------|-----------|-----------|
| Requests/sec | [X] | [Y] | [Z]% |
| Avg Response | [Xms] | [Yms] | [Z]ms |

### Issues Found
1. [Issue 1]
2. [Issue 2]

## Conclusion
✓ Refactored server is ready for [STAGING/PRODUCTION]
OR
✗ Issues need to be resolved before deployment

## Sign-off
Tester: [NAME]
Date: [DATE]
```

---

## 🎯 Success Criteria

The refactored server passes testing when:

1. ✅ All unit tests pass (90%+ coverage)
2. ✅ All API endpoints return identical responses to old server
3. ✅ Error handling is consistent
4. ✅ Performance is acceptable
5. ✅ No TypeScript compilation errors
6. ✅ Database integrity is maintained
7. ✅ Cron endpoints work correctly
8. ✅ Authentication is enforced

---

## 🚀 Next Steps

Once testing is complete and passes:

1. **Update package.json** - Change default dev script to refactored server
2. **Deprecate old server** - Rename `server.ts` to `server-legacy.ts`
3. **Deploy** - Push refactored version to production
4. **Monitor** - Watch logs for any issues
5. **Document** - Update team documentation

---

**Ready to test? Start with the unit tests and work your way through the API endpoints!** 🎉
