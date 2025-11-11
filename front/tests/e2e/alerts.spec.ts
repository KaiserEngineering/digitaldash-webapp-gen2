import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady } from '../utils/test-helpers';

test.describe('Alerts Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToRoute(page, '/alerts');
	});

	test('should display the alerts page', async ({ page }) => {
		await waitForPageReady(page);
		await expect(page).toHaveURL('/alerts');
	});

	test('should have alerts page title or heading', async ({ page }) => {
		await waitForPageReady(page);

		// Look for common alert-related text
		const pageContent = await page.textContent('body');
		expect(pageContent).toBeTruthy();

		// Page should load without errors
		const hasError = await page.locator('text=/error|404/i').isVisible().catch(() => false);
		expect(hasError).toBeFalsy();
	});

	test('should be accessible from home page', async ({ page }) => {
		// Start at home
		await navigateToRoute(page, '/');

		// Click alerts link
		const alertsLink = page.locator('a[href="/alerts"]').first();
		await alertsLink.click();

		// Should navigate to alerts page
		await page.waitForURL('/alerts');
		await expect(page).toHaveURL('/alerts');
	});

	test('should load without JavaScript errors', async ({ page }) => {
		const errors: string[] = [];

		page.on('pageerror', (error) => {
			errors.push(error.message);
		});

		await waitForPageReady(page);

		// Should have no critical JavaScript errors
		expect(errors.length).toBe(0);
	});
});
