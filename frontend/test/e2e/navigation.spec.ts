import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * Tests global navigation, routing, and link functionality across ZACORPS
 */
test.describe('Navigation', () => {
    test('should load home page successfully', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/ZACORPS|Zamacorps/i);
        // Check for ZACORPS branding
        const hasZacorps = await page.locator('text=/ZACORPS/i').first().isVisible();
        expect(hasZacorps).toBeTruthy();
    });

    test('should navigate to Admin login from home', async ({ page }) => {
        await page.goto('/');
        await page.click('text=ADMIN');
        await expect(page).toHaveURL(/\/admin/);
    });

    test('should navigate to About page', async ({ page }) => {
        await page.goto('/');
        // Click ABOUT US (may be in dropdown or direct link)
        const aboutLink = page.locator('text=/ABOUT/i').first();
        await aboutLink.click();
        await expect(page).toHaveURL(/\/about/);
    });

    test('should have working HOME navigation link', async ({ page }) => {
        await page.goto('/about');
        await page.click('text=HOME');
        await expect(page).toHaveURL('/');
    });

    test('should navigate to Employee login', async ({ page }) => {
        await page.goto('/employee/login');
        await expect(page).toHaveURL(/\/employee\/login/);
    });

    test('should navigate to HR page', async ({ page }) => {
        await page.goto('/hr');
        await expect(page).toHaveURL(/\/hr/);
    });

    test('should have responsive navigation bar', async ({ page }) => {
        await page.goto('/');
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
    });

    test('should maintain navigation across all pages', async ({ page }) => {
        const pages = ['/', '/about', '/admin/login', '/employee/login'];

        for (const url of pages) {
            await page.goto(url);
            const homeLink = page.locator('text=HOME').first();
            await expect(homeLink).toBeVisible();
        }
    });
});
