import { type Page, expect } from '@playwright/test';
import { setupApiMocks } from './mock-api';

/**
 * Wait for navigation to complete and page to be ready
 */
export async function waitForPageReady(page: Page) {
	await page.waitForLoadState('domcontentloaded');
	// Wait for network to be mostly idle, but don't wait too long for failing API calls
	try {
		await page.waitForLoadState('networkidle', { timeout: 10000 });
	} catch {
		// If network never goes idle (e.g., polling or failing requests), continue anyway
		// as long as DOM is ready
	}
}

/**
 * Navigate to a route and wait for it to load
 * By default, sets up API mocks to prevent real API calls
 */
export async function navigateToRoute(page: Page, route: string, options?: { mockApi?: boolean }) {
	const mockApi = options?.mockApi !== false; // Default to true

	if (mockApi) {
		await setupApiMocks(page);
	}

	await page.goto(route);
	await waitForPageReady(page);

	// Wait for any loading states to complete
	try {
		await page.waitForSelector('text=Loading Digital Dash', { state: 'hidden', timeout: 5000 });
	} catch {
		// Loading screen might not appear or might already be gone
	}
}

/**
 * Check if an element is visible
 */
export async function expectVisible(page: Page, selector: string) {
	await expect(page.locator(selector)).toBeVisible();
}

/**
 * Check if an element contains text
 */
export async function expectText(page: Page, selector: string, text: string | RegExp) {
	await expect(page.locator(selector)).toContainText(text);
}

/**
 * Click element and wait for navigation
 */
export async function clickAndWait(page: Page, selector: string) {
	await page.click(selector);
	await waitForPageReady(page);
}

/**
 * Fill input field
 */
export async function fillInput(page: Page, selector: string, value: string) {
	await page.fill(selector, value);
}

/**
 * Take a screenshot with a specific name
 */
export async function takeScreenshot(page: Page, name: string) {
	await page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
}

/**
 * Wait for a specific selector to be visible
 */
export async function waitForSelector(page: Page, selector: string, timeout = 5000) {
	await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if localStorage contains a specific key
 */
export async function checkLocalStorage(page: Page, key: string): Promise<boolean> {
	const value = await page.evaluate((k) => localStorage.getItem(k), key);
	return value !== null;
}

/**
 * Get localStorage value
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
	return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set localStorage value
 */
export async function setLocalStorage(page: Page, key: string, value: string) {
	await page.evaluate(
		({ k, v }) => localStorage.setItem(k, v),
		{ k: key, v: value }
	);
}

/**
 * Clear all localStorage
 */
export async function clearLocalStorage(page: Page) {
	await page.evaluate(() => localStorage.clear());
}
