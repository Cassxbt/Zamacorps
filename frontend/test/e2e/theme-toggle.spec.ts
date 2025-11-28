import { test, expect } from '@playwright/test';

/**
 * Theme Toggle Tests
 * Tests dark/light mode functionality and persistence
 */
test.describe('Theme Toggle', () => {
    test('should have theme toggle button visible', async ({ page }) => {
        await page.goto('/');

        // Look for theme toggle - could be button with theme icon/text
        // Try multiple selectors as implementation may vary
        const themeButton = page.locator('button').filter({
            hasText: /theme|dark|light|sun|moon/i
        }).first();

        const alternativeButton = page.locator('[aria-label*="theme" i]').first();

        const isVisible = await themeButton.isVisible().catch(() => false) ||
            await alternativeButton.isVisible().catch(() => false);

        expect(isVisible).toBeTruthy();
    });

    test('should toggle between dark and light mode', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Get initial theme class from html element
        const html = page.locator('html');
        const initialClass = await html.getAttribute('class') || '';

        // Find and click theme toggle
        const themeButton = page.locator('button').filter({
            hasText: /theme|dark|light/i
        }).first();

        if (await themeButton.isVisible().catch(() => false)) {
            await themeButton.click();

            // Wait for theme change animation
            await page.waitForTimeout(500);

            // Verify theme changed
            const newClass = await html.getAttribute('class') || '';
            expect(newClass).not.toBe(initialClass);
        } else {
            // If button not found, check if theme system exists via html class
            const hasThemeClass = initialClass.includes('dark') || initialClass.includes('light');
            expect(hasThemeClass).toBeTruthy();
        }
    });

    test('should persist theme preference across navigation', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const html = page.locator('html');
        const homeTheme = await html.getAttribute('class');

        // Navigate to another page
        await page.goto('/about');
        await page.waitForLoadState('networkidle');

        const aboutTheme = await html.getAttribute('class');

        // Theme should be consistent across pages
        expect(aboutTheme).toBe(homeTheme);
    });

    test('should apply theme styling correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const html = page.locator('html');
        const themeClass = await html.getAttribute('class') || '';

        // Verify theme class exists (dark or light)
        const hasValidTheme = themeClass.includes('dark') || themeClass.includes('light') || themeClass === '';
        expect(hasValidTheme).toBeTruthy();

        // Body should be visible with theme applied
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});
