import { test, expect } from '@playwright/test';

/**
 * Home Page Tests
 * Tests the main landing page content, branding, and functionality
 */
test.describe('Home Page', () => {
    test('should display ZACORPS branding', async ({ page }) => {
        await page.goto('/');
        const branding = page.locator('text=/ZACORPS/i').first();
        await expect(branding).toBeVisible();
    });

    test('should show professional hero section', async ({ page }) => {
        await page.goto('/');
        // Check for key messaging about privacy/FHE/payroll
        const content = await page.textContent('body');
        const hasRelevantContent =
            content?.toLowerCase().includes('privacy') ||
            content?.toLowerCase().includes('fhe') ||
            content?.toLowerCase().includes('encrypt') ||
            content?.toLowerCase().includes('payroll');

        expect(hasRelevantContent).toBeTruthy();
    });

    test('should display feature cards or sections', async ({ page }) => {
        await page.goto('/');
        // Verify structured content exists
        const main = page.locator('main').first();
        await expect(main).toBeVisible();

        // Should have some content sections
        const sections = await page.locator('section, div[class*="card"], div[class*="feature"]').count();
        expect(sections).toBeGreaterThan(0);
    });

    test('should have call-to-action elements', async ({ page }) => {
        await page.goto('/');
        // Check for interactive elements (buttons or links)
        const buttons = page.locator('button, a[class*="button"]');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);
    });

    test('should load without JavaScript errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Filter out known MetaMask/Web3 warnings
        const criticalErrors = errors.filter(e =>
            !e.toLowerCase().includes('metamask') &&
            !e.toLowerCase().includes('ethereum') &&
            !e.toLowerCase().includes('wallet')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('should be mobile responsive', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
        await page.goto('/');

        // Navigation should still be visible/accessible
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();

        // Content should be visible
        const main = page.locator('main').first();
        await expect(main).toBeVisible();
    });
});
