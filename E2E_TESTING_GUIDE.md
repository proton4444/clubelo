# E2E Testing with Playwright - Complete Guide

This document provides a comprehensive guide to the E2E testing setup for the ClubElo refactored server using Playwright.

## Overview

**What is E2E Testing?**
End-to-End (E2E) testing simulates real user interactions with the application, testing the complete flow from frontend to backend through actual browser automation.

**Why Playwright?**
- Cross-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing (iOS, Android)
- Automatic browser context management
- Built-in debugging and tracing tools
- Excellent CI/CD integration
- Fast parallel execution

## Project Setup

### Installation

Playwright is already installed and configured:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.56.1"
  }
}
```

### Configuration

**File**: `playwright.config.ts`

Key features:
- **Base URL**: Auto-detected from environment (`PLAYWRIGHT_TEST_BASE_URL`)
- **Multi-browser**: Tests run on Chromium, Firefox, WebKit
- **Mobile testing**: Tests on Pixel 5 and iPhone 12
- **CI/CD aware**: Adjusts settings based on `CI` environment variable
- **Artifacts**: Saves screenshots, videos, and traces on failure

```typescript
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
const IS_CI = !!process.env.CI;

// CI: Server already running, 1 worker, 2 retries
// Local: Auto-start server, auto workers, no retries
```

## Test Files

### 1. API Tests (`e2e/api.spec.ts`)

Tests all REST API endpoints without UI interaction.

**Coverage**:
- Health check endpoint
- Rankings API (filtering, pagination, validation)
- Clubs API (search, history)
- Fixtures API
- Error handling (404, 400, validation errors)

**Key Tests**:

```typescript
// Health check
test('should return 200 OK', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
});

// Rankings with pagination
test('should support pagination', async ({ request }) => {
  const response = await request.get('/api/elo/rankings?page=2&pageSize=20');
  const body = await response.json();
  expect(body.pagination.page).toBe(2);
});

// Error handling
test('should reject invalid page', async ({ request }) => {
  const response = await request.get('/api/elo/rankings?page=0');
  expect(response.status()).toBe(400);
});
```

**What Gets Tested**:
- ✅ Response status codes
- ✅ Response payload structure
- ✅ Data validation
- ✅ Pagination logic
- ✅ Filtering (country, minElo, level)
- ✅ Error cases and edge cases

### 2. UI Tests (`e2e/ui.spec.ts`)

Tests frontend pages and user interactions.

**Coverage**:
- Home page loading
- Navigation elements
- API documentation page
- 404 error handling
- Performance metrics
- Responsive design (desktop, mobile, tablet)
- Accessibility checks

**Key Tests**:

```typescript
// Page loading
test('should load home page', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('h1, h2');
  await expect(heading).toBeDefined();
});

// No console errors
test('should not have console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  await page.goto('/');
  expect(errors.length).toBe(0);
});

// Performance
test('should load page within reasonable time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000); // 5 seconds
});
```

**What Gets Tested**:
- ✅ Page rendering
- ✅ Navigation functionality
- ✅ Browser console for errors
- ✅ Page load performance
- ✅ Responsive layouts
- ✅ Accessibility (alt text, ARIA labels)

## Running Tests

### 1. Run All Tests

```bash
npm run test:e2e
```

**Output**:
- Test summary (passed/failed/skipped)
- Performance report
- Links to artifacts

**Parallel Execution**:
- Local: Runs on all available CPU cores
- CI: Runs with 1 worker (more stable)

### 2. Run UI Tests Only

```bash
npm run test:e2e -- --grep "ClubElo Frontend"
```

### 3. Run API Tests Only

```bash
npm run test:e2e -- --grep "ClubElo API"
```

### 4. Run Single Test

```bash
npx playwright test -g "should return rankings"
```

### 5. Debug Mode (Interactive)

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector where you can:
- Step through tests line by line
- Inspect DOM elements
- View network requests
- Take screenshots
- Execute JavaScript in console

### 6. Watch Mode (Recommended for TDD)

```bash
npx playwright test --watch
```

Automatically reruns tests on file changes.

### 7. Generate HTML Report

```bash
npm run test:e2e
npm run test:e2e:report
```

Opens interactive HTML report with:
- Timeline view of all tests
- Screenshots on failure
- Video recordings
- Detailed error messages
- Execution duration for each test

## Environment Variables

### For Local Testing

```bash
# Default values (no need to set unless different)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3001
PLAYWRIGHT_TIMEOUT=30000
```

### For Testing Vercel Deployment

```bash
# Test against live Vercel instance
PLAYWRIGHT_TEST_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

### For CI/CD

```bash
# Automatically set by GitHub Actions
CI=true
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3001
```

## Test Results & Artifacts

### Local Results

After running tests, artifacts are saved in `test-results/`:

```
test-results/
├── results.json          # JSON summary
├── junit.xml             # JUnit XML for CI
├── index.html            # Interactive HTML report
├── chromium/             # Chromium test results
├── firefox/              # Firefox test results
└── webkit/               # WebKit test results
```

### View Results

**HTML Report**:
```bash
npm run test:e2e:report
```

**JSON Results**:
```bash
cat test-results/results.json | jq .
```

**Screenshots/Videos**:
- Automatically captured on test failure
- Located in `test-results/chromium/`, `firefox/`, etc.
- Linked in HTML report

## Troubleshooting

### Tests Pass Locally but Fail on CI

**Causes**:
1. Different environment variables
2. Server not ready in CI
3. Database state differs
4. Timezone differences

**Solutions**:
```bash
# Simulate CI environment locally
CI=true npm run test:e2e

# Check server is running
curl http://localhost:3001/health

# Verify database state
psql $DATABASE_URL -c "SELECT COUNT(*) FROM clubs;"
```

### "Port 3001 already in use"

```bash
# Kill existing process
# On Windows (PowerShell):
Get-Process | Where-Object {$_.Port -eq 3001} | Stop-Process -Force

# On macOS/Linux:
lsof -ti:3001 | xargs kill -9
```

### Playwright Browsers Not Found

```bash
# Install Playwright browsers
npx playwright install --with-deps

# On CI, this is done automatically in workflow
```

### Tests Timeout

```bash
# Increase timeout in playwright.config.ts
use: {
  baseURL: BASE_URL,
  navigationTimeout: 30000,  // Increase from default
  actionTimeout: 10000,      // Increase from default
}

# Or set environment variable
PLAYWRIGHT_TIMEOUT=60000 npm run test:e2e
```

### Network Errors in Tests

Check if server is running:
```bash
npm run dev  # Start server in another terminal
npm run test:e2e
```

### Flaky Tests (Random Failures)

**Symptoms**: Test passes 90% of time, fails randomly

**Solutions**:

1. Add explicit waits:
```typescript
// Bad - implicit wait
await page.click('button');

// Good - explicit wait
await expect(page.locator('button')).toBeEnabled();
await page.click('button');
```

2. Increase retries in config:
```typescript
retries: IS_CI ? 3 : 0  // Retry 3 times on CI
```

3. Check for JavaScript errors:
```typescript
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('❌', msg.text());
});
```

## Best Practices

### 1. Use Data Attributes for Selection

**Bad**:
```typescript
await page.click('button.blue');  // Brittle - depends on CSS
```

**Good**:
```typescript
// In HTML: <button data-testid="submit-btn">Submit</button>
await page.click('[data-testid="submit-btn"]');
```

### 2. Wait for Elements Explicitly

**Bad**:
```typescript
await page.goto('/api/rankings');
await page.click('button');  // May fail if button not ready
```

**Good**:
```typescript
await page.goto('/api/rankings');
await expect(page.locator('button')).toBeVisible();
await page.click('button');
```

### 3. Use Meaningful Assertions

**Bad**:
```typescript
expect(response.status()).toBe(200);
```

**Good**:
```typescript
expect(response.status()).toBe(200);
const body = await response.json();
expect(body).toHaveProperty('data');
expect(body.data).toBeInstanceOf(Array);
```

### 4. Clean Up After Tests

**Bad**:
```typescript
test('should create ranking', async ({ request }) => {
  await request.post('/api/rankings', { data: {...} });
  // Leaves test data in database
});
```

**Good**:
```typescript
test('should create ranking', async ({ request }) => {
  const response = await request.post('/api/rankings', { data: {...} });
  const id = response.json().id;
  
  // Cleanup
  await request.delete(`/api/rankings/${id}`);
});
```

### 5. Group Related Tests

```typescript
test.describe('Clubs API', () => {
  test.describe('GET /api/clubs', () => {
    test('should return list', async ({ request }) => { ... });
    test('should filter by country', async ({ request }) => { ... });
    test('should handle pagination', async ({ request }) => { ... });
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/e2e-tests.yml** automatically:

1. Runs on push to `main`/`develop`
2. Runs on every pull request
3. Starts PostgreSQL service
4. Builds application
5. Runs E2E tests
6. Uploads artifacts
7. Comments PR with results

### View Results on GitHub

1. Go to Pull Request
2. Scroll to "Checks" section
3. Click "Details" on failed checks
4. View build log and test output

### Download Test Artifacts

1. Go to GitHub Actions run
2. Scroll to bottom → "Artifacts"
3. Download `playwright-results`
4. Extract and open `index.html`

## Performance Monitoring

### Test Execution Time

```bash
npm run test:e2e
# Output shows timing for each test and browser
```

### Browser Performance Metrics

```typescript
test('should measure performance', async ({ page }) => {
  const metrics = await page.evaluate(() => {
    const perf = window.performance;
    return {
      navigationTime: perf.timing.navigationStart,
      loadTime: perf.timing.loadEventEnd - perf.timing.navigationStart,
      domInteractiveTime: perf.timing.domInteractive - perf.timing.navigationStart,
    };
  });
  
  console.log('Performance Metrics:', metrics);
  expect(metrics.loadTime).toBeLessThan(3000);
});
```

### Network Monitoring

```typescript
test('should check network performance', async ({ page }) => {
  const requests = await page.context().waitForEvent('requestfinished');
  
  requests.forEach(request => {
    const timing = request.timing();
    console.log(`${request.method()} ${request.url()}: ${timing.responseEnd - timing.requestStart}ms`);
  });
});
```

## Debugging Failed Tests

### Method 1: Debug Mode

```bash
npm run test:e2e:debug
```

### Method 2: Save Trace

```typescript
test('should debug something', async ({ page }) => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  
  // Your test code
  await page.goto('/');
  
  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

View trace:
```bash
npx playwright show-trace trace.zip
```

### Method 3: Screenshots on Failure

Already configured! Screenshots are automatically saved on test failure.

View in HTML report:
```bash
npm run test:e2e:report
```

## Advanced Features

### Custom Fixtures

Create reusable test utilities:

```typescript
// fixtures.ts
import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-btn"]');
    await page.waitForNavigation();
    
    await use(page);
    
    // Cleanup
    await page.goto('/logout');
  },
});
```

### Parameterized Tests

Test multiple scenarios:

```typescript
const countries = ['ENG', 'GER', 'ESP', 'ITA', 'FRA'];

countries.forEach(country => {
  test(`should filter by ${country}`, async ({ request }) => {
    const response = await request.get(`/api/elo/rankings?country=${country}`);
    const body = await response.json();
    
    body.clubs.forEach(club => {
      expect(club.country).toBe(country);
    });
  });
});
```

### Retry Specific Tests

```typescript
test('flaky test', async ({ page }) => {
  test.setTimeout(120000);  // 2 minutes timeout
  // test code
});

test.retry(3, 'another flaky test', async ({ page }) => {
  // test code
});
```

## Summary

| Task | Command |
|------|---------|
| Run all tests | `npm run test:e2e` |
| Debug tests | `npm run test:e2e:debug` |
| View report | `npm run test:e2e:report` |
| Run single test | `npx playwright test -g "test name"` |
| Run in watch mode | `npx playwright test --watch` |
| Test Vercel URL | `PLAYWRIGHT_TEST_BASE_URL=https://app.vercel.app npm run test:e2e` |
| Install browsers | `npx playwright install --with-deps` |

## Next Steps

1. ✅ Tests configured and ready
2. ✅ GitHub Actions workflow set up
3. ✅ Playwright configuration complete
4. 📋 Run tests locally: `npm run test:e2e`
5. 📋 Fix any failures
6. 📋 Commit to GitHub to trigger CI/CD
7. 📋 Monitor test results on GitHub Actions
8. 📋 Deploy to Vercel
9. 📋 Run tests against live Vercel instance

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Debugging](https://playwright.dev/docs/debug)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI/CD](https://playwright.dev/docs/ci)
