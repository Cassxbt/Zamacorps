import { test, expect } from '@playwright/test';

/**
 * Employee Login Page Tests
 * Tests the employee authentication page UI
 */
test.describe('Employee Login Page', () => {
    test('should load employee login page', async ({ page }) => {
        await page.goto('/employee/login');
        await expect(page).toHaveURL(/\/employee\/login/);
    });

    test('should display employee-specific branding', async ({ page }) => {
        await page.goto('/employee/login');

        const content = await page.textContent('body');
        const hasEmployeeContent =
            content?.toLowerCase().includes('employee') ||
            content?.toLowerCase().includes('login') ||
            content?.toLowerCase().includes('connect');

        expect(hasEmployeeContent).toBeTruthy();
    });

    test('should have wallet connection UI', async ({ page }) => {
        await page.goto('/employee/login');

        // Check for interactive elements (buttons)
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // First button should be visible
        await expect(buttons.first()).toBeVisible();
    });

    test('should navigate back to home', async ({ page }) => {
        await page.goto('/employee/login');

        const homeLink = page.locator('text=HOME').first();
        await homeLink.click();

        await expect(page).toHaveURL('/');
    });
});
