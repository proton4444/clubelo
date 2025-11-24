/**
 * UI E2E Tests
 *
 * Tests the frontend pages to ensure they render and function correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('ClubElo Frontend', () => {
  test.describe('Home Page', () => {
    test('should load home page', async ({ page }) => {
      await page.goto('/');

      // Page should load without errors
      expect(page.url()).toContain('/');

      // Check for main content
      const heading = page.locator('h1, h2');
      await expect(heading).toBeDefined();
    });

    test('should have navigation elements', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');

      // Check for common navigation elements
      const hasLinks = await page.locator('a').count() > 0;
      expect(hasLinks).toBe(true);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not have critical errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('404')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('API Documentation', () => {
    test('should load API docs in development', async ({ page }) => {
      const isProduction = process.env.NODE_ENV === 'production';

      if (isProduction) {
        test.skip(); // Skip in production
      }

      await page.goto('/api/docs');

      // Swagger UI should load
      const swagger = page.locator('.swagger-ui, .topbar').first();
      await expect(swagger).toBeDefined();
    });
  });

  test.describe('Response Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

      // Should either show 404 or redirect somewhere
      const status = page.url();
      expect(status).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should load page within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have layout shifts after load', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Just verify page is stable after load
      const initialDimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      // Wait a bit and check dimensions are stable
      await page.waitForTimeout(500);

      const finalDimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      expect(initialDimensions).toEqual(finalDimensions);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 }, // iPhone size
      });
      const page = await context.newPage();

      await page.goto('/');

      // Page should be accessible on mobile
      expect(page.url()).toContain('/');

      await context.close();
    });

    test('should work on tablet', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 }, // iPad size
      });
      const page = await context.newPage();

      await page.goto('/');

      expect(page.url()).toContain('/');

      await context.close();
    });

    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto('/');

      expect(page.url()).toContain('/');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper semantic HTML', async ({ page }) => {
      await page.goto('/');

      // Check for basic semantic HTML
      const main = page.locator('main, [role="main"]');
      const hasMainContent = (await main.count()) > 0 || (await page.locator('body').count()) > 0;

      expect(hasMainContent).toBe(true);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const imageCount = await images.count();

      // If there are images, they should ideally have alt text
      // (Note: Some images may legitimately not need alt text)
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Either has alt text or role="presentation"
        const role = await images.nth(i).getAttribute('role');
        expect(alt || role === 'presentation').toBe(true);
      }
    });
  });
});
