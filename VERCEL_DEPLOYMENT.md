# Vercel Deployment with Playwright E2E Testing

This guide explains how to deploy the ClubElo refactored server to Vercel and configure Playwright E2E testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Setup](#vercel-setup)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Playwright Testing on Vercel](#playwright-testing-on-vercel)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Vercel account: https://vercel.com
- GitHub repository connected to Vercel
- PostgreSQL database (Vercel Postgres or external)
- Node.js 20+ for local testing
- Playwright installed locally for testing

---

## Vercel Setup

### 1. Connect GitHub Repository

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Vercel will auto-detect the project as Node.js

### 2. Configure Build Settings

The `vercel.json` file is already configured:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "startCommand": "node dist/server-refactored.js"
}
```

**Key settings:**
- **Build Command**: Compiles TypeScript using `tsc`
- **Install Command**: Uses `npm ci` for clean, reproducible installs
- **Start Command**: Runs the refactored server entry point

### 3. Verify Deployment

After pushing to GitHub, Vercel will automatically:
1. Clone the repository
2. Install dependencies with `npm ci`
3. Run the build command (`npm run build`)
4. Deploy the built application
5. Run Playwright tests (via GitHub Actions)

---

## Environment Variables

### Required for Vercel Deployment

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/clubelo
NODE_ENV=production
PORT=3001
CRON_SECRET=your-secret-key-for-cron-endpoints
```

### For Local Testing (`.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clubelo_test
NODE_ENV=development
PORT=3001
CRON_SECRET=local-secret-key
```

### For Playwright Testing

```
PLAYWRIGHT_TEST_BASE_URL=https://your-vercel-deployment.vercel.app
```

---

## Database Setup

### Option 1: Vercel Postgres

1. Go to Vercel Dashboard → Storage
2. Click "Create Database" → "Postgres"
3. Follow the prompts
4. Copy the `POSTGRES_URL` and add to Environment Variables as `DATABASE_URL`

### Option 2: External PostgreSQL

If using an external database:

1. Ensure the database is accessible from Vercel IPs
2. Add `DATABASE_URL` to Vercel Environment Variables
3. Run migrations: See database migration section

### Database Migrations

Migrations should run automatically on deployment. If using Prisma:

```bash
# Local migration creation
npx prisma migrate dev --name initial-schema

# Vercel deployment migration (via build script)
# Add to package.json: "postbuild": "npx prisma migrate deploy"
```

---

## Playwright Testing on Vercel

### Architecture

The E2E testing runs in **GitHub Actions** (not directly on Vercel):

```
GitHub Push → GitHub Actions CI → Test on real Vercel URL → Report results
```

### Test Configuration

**playwright.config.ts** automatically detects the environment:

```typescript
const IS_CI = !!process.env.CI;
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';

// On Vercel/CI: expects server already running
// Locally: auto-starts server before tests
```

### Running Tests Against Vercel Deployment

```bash
# Local: Test against deployed Vercel instance
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e

# Run with UI for debugging
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e:ui

# Generate HTML report
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e:report
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/e2e-tests.yml` workflow:

1. **Triggers on**: Push to `main`/`develop`, or Pull Request
2. **Services**: Starts PostgreSQL service container
3. **Steps**:
   - Checkout code
   - Setup Node.js 20
   - Install dependencies
   - Build TypeScript
   - Setup test database with migrations
   - Install Playwright browsers
   - Start server in background
   - Run E2E tests
   - Upload test results as artifacts
   - Comment PR with results

### Automatic Testing on PR

When you create a PR:

1. Workflow automatically runs
2. Tests run against the built application
3. Results are posted as a PR comment
4. Artifacts (screenshots, videos, traces) saved for 30 days
5. PR blocks merge if tests fail (if required)

### Linking to Vercel

To also test against the Vercel preview deployment:

1. Enable "Production Deployment" checks in Vercel
2. Wait for Vercel to deploy preview
3. Optionally add Vercel action to GitHub workflow to test preview URL

---

## Monitoring & Debugging

### View Test Results

#### Option 1: GitHub Actions Artifacts

1. Go to GitHub repo → Actions → Latest run
2. Scroll down to "Artifacts"
3. Download `playwright-results.zip`
4. Extract and open `index.html` in a browser

#### Option 2: Playwright HTML Report

```bash
npm run test:e2e:report
```

This opens the interactive test report showing:
- Test timeline
- Screenshots on failure
- Video recordings
- Detailed error messages
- Performance metrics

### Debug Test Failures

```bash
# Run tests in debug mode (step through)
npm run test:e2e:debug

# Run with trace for detailed inspection
TRACE=on npm run test:e2e

# Run single test file
npx playwright test e2e/api.spec.ts

# Run single test
npx playwright test -g "should return health status"
```

### Logs

#### Vercel Deployment Logs

1. Vercel Dashboard → Project → Deployments
2. Click on a deployment
3. View build logs and runtime logs

#### GitHub Actions Logs

1. GitHub repo → Actions
2. Click on workflow run
3. Expand "Run Playwright tests" step to see output

### Performance Metrics

Check tests take < 20 seconds per test:

```bash
npm run test:e2e -- --reporter=html

# Open test-results/index.html to see timing
```

---

## Troubleshooting

### Issue: Tests Pass Locally But Fail on Vercel

**Cause**: Different environment or database state

**Solutions**:
1. Check environment variables match between local and Vercel
2. Verify database migrations ran: Check Vercel logs
3. Check database connectivity: Ensure Vercel IP is whitelisted
4. Run tests against staging database locally:
   ```bash
   PLAYWRIGHT_TEST_BASE_URL=https://staging.example.com npm run test:e2e
   ```

### Issue: Playwright Browsers Not Installing

**Cause**: Missing dependencies or disk space

**Solutions**:
```bash
# Local: Reinstall with dependencies
npx playwright install --with-deps

# Vercel: Already handled in GitHub Actions workflow
# But ensure .playwright directory isn't gitignored
```

### Issue: Tests Timeout on CI

**Cause**: Server slow to start or database connection issue

**Solutions**:
1. Increase timeout in playwright.config.ts:
   ```typescript
   webServer: {
     timeout: 180 * 1000, // 3 minutes instead of 2
   }
   ```
2. Check database logs for slow queries
3. Verify server starts: `curl http://localhost:3001/health`

### Issue: Database Locked During Tests

**Cause**: Parallel test workers competing for database

**Solutions**:
```bash
# Run tests serially on CI
CI=1 npx playwright test --workers=1

# Or configure in playwright.config.ts for CI
workers: IS_CI ? 1 : undefined
```

### Issue: Random Test Failures (Flaky Tests)

**Cause**: Race conditions or timing issues

**Solutions**:
1. Add explicit waits:
   ```typescript
   await expect(page).toHaveURL(/^http:\/\/localhost:3001\/api\/rankings/);
   ```
2. Increase retry count in playwright.config.ts:
   ```typescript
   retries: IS_CI ? 3 : 0
   ```
3. Check for JavaScript errors:
   ```bash
   npm run test:e2e:debug
   ```

### Issue: "Port 3001 Already in Use"

**Cause**: Previous server instance still running

**Solutions**:
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run test:e2e
```

---

## Summary

| Phase | Tool | Command |
|-------|------|---------|
| **Local Dev** | Express | `npm run dev` |
| **Local Testing** | Playwright | `npm run test:e2e` |
| **Build** | TypeScript | `npm run build` |
| **Production** | Vercel | Auto-deployed |
| **E2E on PR** | GitHub Actions | Automatic |
| **Debug Tests** | Playwright Inspector | `npm run test:e2e:debug` |

## Next Steps

1. ✅ Push to GitHub
2. ✅ Vercel auto-deploys
3. ✅ GitHub Actions runs E2E tests
4. ✅ PR comments show results
5. ✅ View reports in GitHub artifacts
6. ✅ Monitor in Vercel dashboard
