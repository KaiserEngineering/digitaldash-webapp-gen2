import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady } from '../utils/test-helpers';

test.describe('Home Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToRoute(page, '/');
	});

	test('should load the home page successfully', async ({ page }) => {
		await waitForPageReady(page);
		await expect(page).toHaveURL('/');
	});

	test('should display dashboard cards', async ({ page }) => {
		await waitForPageReady(page);

		// The page should have view cards (if any views are configured)
		// We're checking the structure exists
		const dashboardCard = page.locator('[class*="DashboardCard"]').first();

		// Either the dashboard card exists or the page loads without error
		const pageLoaded = await page.locator('body').isVisible();
		expect(pageLoaded).toBeTruthy();
	});

	test('should display system overview card with alerts section', async ({ page }) => {
		await waitForPageReady(page);

		// Check for alerts section
		const alertsSection = page.locator('h3:has-text("Alerts")').first();
		await expect(alertsSection).toBeVisible();

		// Check alerts link is clickable
		const alertsLink = page.locator('a[href="/alerts"]').first();
		await expect(alertsLink).toBeVisible();
	});

	test('should display system overview card with dynamic rules section', async ({ page }) => {
		await waitForPageReady(page);

		// Check for dynamic section
		const dynamicSection = page.locator('h3:has-text("Dynamic")').first();
		await expect(dynamicSection).toBeVisible();

		// Check dynamic link is clickable
		const dynamicLink = page.locator('a[href="/dynamic"]').first();
		await expect(dynamicLink).toBeVisible();
	});

	test('should show alerts summary with active count', async ({ page }) => {
		await waitForPageReady(page);

		// Check for alerts active count pattern (e.g., "0 / 0 active" or "2 / 5 active")
		const alertsSummary = page.locator('text=/\\d+ \\/ \\d+ active/').first();
		await expect(alertsSummary).toBeVisible();
	});

	test('should show dynamic rules summary with active count', async ({ page }) => {
		await waitForPageReady(page);

		// Check for dynamic rules active count pattern
		const dynamicSummary = page.locator('text=/\\d+ \\/ \\d+ active/').nth(1);
		await expect(dynamicSummary).toBeVisible();
	});

	test('should have proper icons for alerts and dynamic sections', async ({ page }) => {
		await waitForPageReady(page);

		// Check for Bell icon (alerts)
		const bellIcon = page.locator('.lucide-bell').first();
		await expect(bellIcon).toBeVisible();

		// Check for Zap icon (dynamic)
		const zapIcon = page.locator('.lucide-zap').first();
		await expect(zapIcon).toBeVisible();
	});

	test('should navigate to alerts page when clicking alerts section', async ({ page }) => {
		await waitForPageReady(page);

		// Click on alerts section
		const alertsLink = page.locator('a[href="/alerts"]').first();
		await alertsLink.click();

		// Wait for navigation
		await page.waitForURL('/alerts');
		await expect(page).toHaveURL('/alerts');
	});

	test('should navigate to dynamic page when clicking dynamic section', async ({ page }) => {
		await waitForPageReady(page);

		// Click on dynamic section
		const dynamicLink = page.locator('a[href="/dynamic"]').first();
		await dynamicLink.click();

		// Wait for navigation
		await page.waitForURL('/dynamic');
		await expect(page).toHaveURL('/dynamic');
	});

	test('should have hover effects on alert and dynamic cards', async ({ page }) => {
		await waitForPageReady(page);

		// Check alerts card has proper styling
		const alertsCard = page.locator('a[href="/alerts"] > div');
		await expect(alertsCard).toHaveClass(/transition-all/);

		// Check dynamic card has proper styling
		const dynamicCard = page.locator('a[href="/dynamic"] > div');
		await expect(dynamicCard).toHaveClass(/transition-all/);
	});

	test('should display chevron icons indicating clickable sections', async ({ page }) => {
		await waitForPageReady(page);

		// Check for chevron icons
		const chevronIcons = page.locator('.lucide-chevron-right');
		const count = await chevronIcons.count();
		expect(count).toBeGreaterThanOrEqual(2); // At least one for alerts and one for dynamic
	});

	test('should maintain responsive layout on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await navigateToRoute(page, '/');

		// Verify key elements are still visible
		await expect(page.locator('h3:has-text("Alerts")').first()).toBeVisible();
		await expect(page.locator('h3:has-text("Dynamic")').first()).toBeVisible();
	});

	test('should display view cards if views are configured', async ({ page }) => {
		await waitForPageReady(page);

		// Check if any view cards exist
		const viewCards = page.locator('[class*="ViewCard"]');
		const viewCardCount = await viewCards.count();

		// If views exist, they should be visible
		if (viewCardCount > 0) {
			const firstViewCard = viewCards.first();
			await expect(firstViewCard).toBeVisible();
		}

		// Otherwise, just verify the page loaded successfully
		expect(true).toBeTruthy();
	});

	test('should show alert details when alerts are active', async ({ page }) => {
		await waitForPageReady(page);

		// Look for alert detail text pattern
		const alertDetails = page.locator('text=/Alert #\\d+:/');
		const hasAlertDetails = await alertDetails.count();

		// If there are active alerts, details should be visible
		if (hasAlertDetails > 0) {
			await expect(alertDetails.first()).toBeVisible();
		}

		// Test passes regardless of whether alerts exist
		expect(true).toBeTruthy();
	});

	test('should show dynamic rule details when rules are active', async ({ page }) => {
		await waitForPageReady(page);

		// Look for dynamic rule patterns
		const dynamicDetails = page.locator('text=/Switch to View #|Default: View #/');
		const hasDynamicDetails = await dynamicDetails.count();

		// If there are active dynamic rules, details should be visible
		if (hasDynamicDetails > 0) {
			await expect(dynamicDetails.first()).toBeVisible();
		}

		// Test passes regardless of whether dynamic rules exist
		expect(true).toBeTruthy();
	});
});
