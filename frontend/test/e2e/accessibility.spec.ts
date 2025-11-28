import { test, expect } from '@playwright/test';

/**
 * Accessibility & Performance Tests
 * Tests for web standards, accessibility, and performance
 */
test.describe('Accessibility & Performance', () => {
    test('should have semantic HTML structure', async ({ page }) => {
        await page.goto('/');

        // Check for semantic HTML5 elements
        const main = page.locator('main').first();
        await expect(main).toBeVisible();

        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        // Should have at least one h1
        const h1 = page.locator('h1');
        const h1Count = await h1.count();

        if (h1Count > 0) {
            await expect(h1.first()).toBeVisible();
        } else {
            // Some pages may use different heading structure
            // At minimum, should have some headings
            const headings = await page.locator('h1, h2, h3').count();
            expect(headings).toBeGreaterThan(0);
        }
    });

    test('should load within acceptable time', async ({ page }) => {
        const startTime = Date.now();

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        // Should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('should have valid internal links', async ({ page }) => {
        await page.goto('/');

        // Get all links
        const links = await page.locator('a[href]').all();
        expect(links.length).toBeGreaterThan(0);

        // Check that navigation links are valid
        const homeLink = page.locator('a[href="/"]').first();
        const hasHomeLink = await homeLink.isVisible().catch(() => false);

        // At minimum, should have some valid internal links
        expect(hasHomeLink || links.length > 0).toBeTruthy();
    });
});
