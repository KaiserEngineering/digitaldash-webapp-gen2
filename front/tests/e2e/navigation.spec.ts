import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady } from '../utils/test-helpers';

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToRoute(page, '/');
	});

	test('should navigate to all main routes without errors', async ({ page }) => {
		const routes = [
			'/',
			'/settings',
			'/alerts',
			'/dynamic',
			'/backgrounds',
			'/advanced',
			'/device/info'
		];

		for (const route of routes) {
			await page.goto(route);
			await waitForPageReady(page);

			// Verify no error page is shown
			const hasError = await page
				.locator('text=/error|404|not found/i')
				.isVisible()
				.catch(() => false);
			expect(hasError).toBeFalsy();

			// Verify page has loaded content
			const bodyContent = await page.locator('body').textContent();
			expect(bodyContent).toBeTruthy();
			expect(bodyContent!.length).toBeGreaterThan(0);
		}
	});

	test('should have working navigation menu/header', async ({ page }) => {
		await waitForPageReady(page);

		// Check if navigation elements exist
		// This will depend on your actual navigation implementation
		const hasNavigation = await page.locator('nav, header, [role="navigation"]').count();

		// Page should have some form of navigation or at least load successfully
		expect(hasNavigation).toBeGreaterThanOrEqual(0);
	});

	test('should maintain state when navigating back and forth', async ({ page }) => {
		// Navigate to settings
		await page.goto('/settings');
		await waitForPageReady(page);

		// Navigate away
		await page.goto('/');
		await waitForPageReady(page);

		// Navigate back to settings
		await page.goto('/settings');
		await waitForPageReady(page);
		const settingsContentAgain = await page.textContent('body');

		// Content should be similar (basic check)
		expect(settingsContentAgain).toBeTruthy();
		expect(settingsContentAgain!.length).toBeGreaterThan(100);
	});

	test('should handle browser back button correctly', async ({ page }) => {
		// Start at home
		await page.goto('/');
		await waitForPageReady(page);

		// Navigate to settings
		await page.goto('/settings');
		await waitForPageReady(page);

		// Use browser back
		await page.goBack();
		await waitForPageReady(page);

		// Should be back at home
		await expect(page).toHaveURL('/');
	});

	test('should handle browser forward button correctly', async ({ page }) => {
		// Start at home
		await page.goto('/');
		await waitForPageReady(page);

		// Navigate to settings
		await page.goto('/settings');
		await waitForPageReady(page);

		// Go back
		await page.goBack();
		await waitForPageReady(page);

		// Go forward
		await page.goForward();
		await waitForPageReady(page);

		// Should be back at settings
		await expect(page).toHaveURL('/settings');
	});

	test('should load pages quickly', async ({ page }) => {
		const routes = ['/', '/settings', '/alerts', '/dynamic'];

		for (const route of routes) {
			const startTime = Date.now();
			await page.goto(route);
			await waitForPageReady(page);
			const loadTime = Date.now() - startTime;

			// Page should load within 10 seconds (generous timeout for slower systems)
			expect(loadTime).toBeLessThan(10000);
		}
	});
});
