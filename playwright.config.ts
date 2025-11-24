/**
 * Playwright Configuration
 *
 * Configures E2E testing for the refactored ClubElo server.
 * Tests can run locally and on Vercel.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables
 */
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: IS_CI, // Fail on CI if .only is left in tests
  retries: IS_CI ? 2 : 0, // Retry on CI
  workers: IS_CI ? 1 : undefined, // 1 worker on CI, auto on local
  reportSlowTests: IS_CI ? null : { max: 5, threshold: 20000 }, // Report slow tests locally

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: IS_CI
    ? undefined // On CI (Vercel), server should already be running
    : {
        command: 'tsx src/server-refactored.ts',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // See https://playwright.dev/docs/test-webserver#configuring-webserver
});
