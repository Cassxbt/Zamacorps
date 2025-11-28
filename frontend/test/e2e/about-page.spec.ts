import { test, expect } from '@playwright/test';

/**
 * About Page Tests
 * Tests the About page content and layout
 */
test.describe('About Page', () => {
    test('should load about page', async ({ page }) => {
        await page.goto('/about');
        await expect(page).toHaveURL(/\/about/);
    });

    test('should display information about Zama FHE', async ({ page }) => {
        await page.goto('/about');

        const content = await page.textContent('body');
        const hasRelevantContent =
            content?.toLowerCase().includes('fhe') ||
            content?.toLowerCase().includes('zama') ||
            content?.toLowerCase().includes('encryption') ||
            content?.toLowerCase().includes('privacy') ||
            content?.toLowerCase().includes('homomorphic');

        expect(hasRelevantContent).toBeTruthy();
    });

    test('should have structured content sections', async ({ page }) => {
        await page.goto('/about');

        // Check for headings (structured content)
        const headings = page.locator('h1, h2, h3');
        const headingCount = await headings.count();

        expect(headingCount).toBeGreaterThan(0);
        await expect(headings.first()).toBeVisible();
    });

    test('should be accessible via navigation', async ({ page }) => {
        await page.goto('/');

        // Click ABOUT from navigation
        const aboutLink = page.locator('text=/ABOUT/i').first();
        await aboutLink.click();

        await expect(page).toHaveURL(/\/about/);
    });

    test('should have professional layout', async ({ page }) => {
        await page.goto('/about');

        // Check main content area exists
        const main = page.locator('main').first();
        await expect(main).toBeVisible();

        // Page should have meaningful content
        const paragraphs = await page.locator('p').count();
        expect(paragraphs).toBeGreaterThan(0);
    });
});
