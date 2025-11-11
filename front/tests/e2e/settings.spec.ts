import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady } from '../utils/test-helpers';

test.describe('Settings Page', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToRoute(page, '/settings');
	});

	test('should display the settings page with correct title', async ({ page }) => {
		// Check page title - wait up to 10 seconds for content to load
		await expect(
			page.locator('main').getByText('Settings', { exact: true }).first()
		).toBeVisible({
			timeout: 10000
		});

		// Check description
		await expect(
			page.locator('text=Configure your Digital Dash system preferences')
		).toBeVisible();
	});

	test('should show firmware version field', async ({ page }) => {
		// Check firmware version label
		await expect(page.locator('text=Firmware Version')).toBeVisible();

		// Check firmware version input is disabled
		const firmwareInput = page.locator('input[type="number"]').first();
		await expect(firmwareInput).toBeDisabled();
	});

	test('should display splash screen duration field', async ({ page }) => {
		// Check splash screen label
		await expect(page.locator('label:has-text("Splash Screen Duration")')).toBeVisible();

		// Check splash screen input
		const splashInput = page.locator('#splash');
		await expect(splashInput).toBeVisible();

		// Check helper text
		await expect(
			page.locator('text=Set how long the splash screen displays (in seconds)')
		).toBeVisible();
	});

	test('should allow editing splash screen duration when settings are available', async ({
		page
	}) => {
		// Wait for page to load
		await waitForPageReady(page);

		const splashInput = page.locator('#splash');

		// Check if input is enabled (settings available) or disabled (settings unavailable)
		const isDisabled = await splashInput.isDisabled();

		if (!isDisabled) {
			// If enabled, test that we can edit it
			await splashInput.clear();
			await splashInput.fill('5');
			await expect(splashInput).toHaveValue('5');
		} else {
			// If disabled, verify the unavailable message is shown
			await expect(page.locator('text=Settings Unavailable')).toBeVisible();
		}
	});

	test('should display configuration backup section', async ({ page }) => {
		// Check section title
		await expect(page.locator('text=Configuration Backup')).toBeVisible();

		// Check export button
		await expect(page.locator('button:has-text("Export Configuration")')).toBeVisible();

		// Check import button
		await expect(page.locator('button:has-text("Import Configuration")')).toBeVisible();

		// Check warning note
		await expect(
			page.locator(
				'text=Importing a configuration will overwrite your current settings'
			)
		).toBeVisible();
	});

	test('should have save button in footer', async ({ page }) => {
		const saveButton = page.locator('button:has-text("Save Settings")');
		await expect(saveButton).toBeVisible();
	});

	test('should display settings unavailable warning when firmware does not support settings', async ({
		page
	}) => {
		// This test checks if the warning appears (depends on firmware version)
		const warningElement = page.locator('text=Settings Unavailable');

		// Check if warning is present
		const isVisible = await warningElement.isVisible().catch(() => false);

		if (isVisible) {
			// If warning is shown, verify all expected elements
			await expect(page.locator('text=General settings are not available')).toBeVisible();
			await expect(
				page.locator('text=Please update your Digital Dash firmware')
			).toBeVisible();

			// Verify save button is disabled
			const saveButton = page.locator('button:has-text("Save Settings")');
			await expect(saveButton).toBeDisabled();
		}
	});

	test('should have properly styled export button', async ({ page }) => {
		const exportButton = page.locator('button:has-text("Export Configuration")');
		await expect(exportButton).toBeVisible();

		// Check for download icon
		const downloadIcon = exportButton.locator('svg');
		await expect(downloadIcon).toBeVisible();
	});

	test('should have properly styled import button', async ({ page }) => {
		const importButton = page.locator('button:has-text("Import Configuration")');
		await expect(importButton).toBeVisible();

		// Check for upload icon
		const uploadIcon = importButton.locator('svg');
		await expect(uploadIcon).toBeVisible();
	});

	test('should have hidden file input for import functionality', async ({ page }) => {
		const fileInput = page.locator('input[type="file"][accept=".json"]');
		await expect(fileInput).toHaveCount(1);

		// Verify it's hidden
		const isHidden = await fileInput.evaluate((el) => {
			return window.getComputedStyle(el).display === 'none' || el.hidden;
		});
		expect(isHidden).toBeTruthy();
	});

	test('should maintain responsive layout on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await waitForPageReady(page);

		// Verify key elements are still visible
		await expect(page.locator('main').getByText('Settings', { exact: true }).first()).toBeVisible();
		await expect(page.locator('text=Configuration Backup').first()).toBeVisible();
		await expect(page.locator('button:has-text("Export Configuration")')).toBeVisible();
		await expect(page.locator('button:has-text("Import Configuration")')).toBeVisible();
	});

	test('should validate splash screen input accepts only numbers', async ({ page }) => {
		const splashInput = page.locator('#splash');
		const isDisabled = await splashInput.isDisabled();

		if (!isDisabled) {
			// Verify input type is number
			await expect(splashInput).toHaveAttribute('type', 'number');

			// Verify min attribute
			await expect(splashInput).toHaveAttribute('min', '0');
		}
	});
});
