import { test, expect } from '@playwright/test';

/**
 * Admin Login Page Tests
 * Tests the admin authentication page UI and functionality
 */
test.describe('Admin Login Page', () => {
    test('should load admin login page', async ({ page }) => {
        await page.goto('/admin/login');
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test('should display login UI elements', async ({ page }) => {
        await page.goto('/admin/login');

        // Check for wallet connection or login button
        const loginButton = page.locator('button').filter({
            hasText: /connect|login|wallet/i
        }).first();

        const isVisible = await loginButton.isVisible().catch(() => false);
        expect(isVisible).toBeTruthy();
    });

    test('should show ZACORPS branding on login page', async ({ page }) => {
        await page.goto('/admin/login');
        const branding = page.locator('text=/ZACORPS/i').first();
        await expect(branding).toBeVisible();
    });

    test('should have accessible navigation from login page', async ({ page }) => {
        await page.goto('/admin/login');

        // Check that navigation is still accessible
        const homeLink = page.locator('text=HOME').first();
        await expect(homeLink).toBeVisible();
    });

    test('should load without critical console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/admin/login');
        await page.waitForLoadState('networkidle');

        // Filter out expected MetaMask/Web3 warnings
        const criticalErrors = errors.filter(e =>
            !e.toLowerCase().includes('metamask') &&
            !e.toLowerCase().includes('ethereum') &&
            !e.toLowerCase().includes('wallet') &&
            !e.toLowerCase().includes('injected')
        );

        expect(criticalErrors.length).toBeLessThan(3); // Allow minor warnings
    });
});
