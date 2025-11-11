/**
 * Example Test Template
 *
 * This file serves as a template for creating new Playwright tests.
 * Copy this file and modify it for your specific test needs.
 */

import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady, expectVisible } from './utils/test-helpers';

test.describe.skip('Example Test Suite', () => {
	// Runs before each test in this describe block
	test.beforeEach(async ({ page }) => {
		// Navigate to the page you want to test
		await navigateToRoute(page, '/');
	});

	// Runs after each test in this describe block
	test.afterEach(async ({ page }) => {
		// Clean up if needed
		// await page.close();
	});

	test('should load the page', async ({ page }) => {
		// Wait for page to be ready
		await waitForPageReady(page);

		// Verify URL
		await expect(page).toHaveURL('/');

		// Check page content
		const bodyContent = await page.textContent('body');
		expect(bodyContent).toBeTruthy();
	});

	test('should find and interact with elements', async ({ page }) => {
		// Find element by text
		const heading = page.locator('text=Your Heading');
		await expect(heading).toBeVisible();

		// Find element by selector
		const button = page.locator('button.my-button');
		await expect(button).toBeVisible();

		// Click the button
		await button.click();

		// Wait for something to happen
		await page.waitForTimeout(500);
	});

	test('should fill forms', async ({ page }) => {
		// Fill an input
		await page.fill('#input-id', 'test value');

		// Select from dropdown
		await page.selectOption('#select-id', 'option-value');

		// Check checkbox
		await page.check('#checkbox-id');

		// Click submit
		await page.click('button[type="submit"]');
	});

	test('should navigate between pages', async ({ page }) => {
		// Click a link
		await page.click('a[href="/settings"]');

		// Wait for navigation
		await page.waitForURL('/settings');

		// Verify new page loaded
		await expect(page).toHaveURL('/settings');
	});

	test('should verify element attributes', async ({ page }) => {
		// Check attribute exists
		await expect(page.locator('#my-element')).toHaveAttribute('data-test', 'value');

		// Check class
		await expect(page.locator('.my-class')).toHaveClass(/my-class/);

		// Check text content
		await expect(page.locator('h1')).toContainText('Expected Text');
	});

	test('should handle async operations', async ({ page }) => {
		// Click something that triggers async operation
		await page.click('#async-button');

		// Wait for loading to finish
		await expect(page.locator('.loading')).not.toBeVisible();

		// Verify result appeared
		await expect(page.locator('.result')).toBeVisible();
	});

	test('should take screenshot', async ({ page }) => {
		// Take a screenshot
		await page.screenshot({ path: 'test-results/screenshot.png' });

		// Take full page screenshot
		await page.screenshot({ path: 'test-results/full-page.png', fullPage: true });
	});

	test('should test responsive design', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await waitForPageReady(page);

		// Verify mobile-specific elements
		const mobileMenu = page.locator('.mobile-menu');
		await expect(mobileMenu).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await waitForPageReady(page);

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await waitForPageReady(page);
	});

	test('should work with localStorage', async ({ page }) => {
		// Set localStorage
		await page.evaluate(() => {
			localStorage.setItem('test-key', 'test-value');
		});

		// Get localStorage
		const value = await page.evaluate(() => {
			return localStorage.getItem('test-key');
		});

		expect(value).toBe('test-value');

		// Clear localStorage
		await page.evaluate(() => {
			localStorage.clear();
		});
	});

	test.skip('should skip this test', async ({ page }) => {
		// This test will be skipped
		// Use test.skip() for tests that aren't ready yet
	});

	test.fixme('should fix this test later', async ({ page }) => {
		// This test is marked as needing fixes
		// It will be skipped but reported differently
	});
});

// You can also group tests with tags
test.describe.skip('Tagged Tests', () => {
	test('critical test @smoke', async ({ page }) => {
		// This is a smoke test
		await page.goto('/');
		await expect(page).toHaveTitle(/Digital Dash/);
	});

	test('slow test @slow', async ({ page }) => {
		test.slow(); // Mark test as slow, increases timeout
		// Test implementation
	});
});

// Conditional tests
test.describe.skip('Conditional Tests', () => {
	test('only on chromium', async ({ page, browserName }) => {
		test.skip(browserName !== 'chromium', 'This test only runs on Chromium');
		// Test implementation
	});
});
