import { type Page } from '@playwright/test';

/**
 * Mock configuration data
 */
export const mockConfigData = {
	general: [
		{
			EE_Version: 1,
			Splash: 3
		}
	],
	view: [],
	alert: [],
	dynamic: []
};

/**
 * Mock options data
 */
export const mockOptionsData = {
	backgrounds: [],
	pids: []
};

/**
 * Mock PIDs data
 */
export const mockPidsData = [];

/**
 * Setup API mocks for a page
 * This intercepts API calls and returns mock data instead
 */
export async function setupApiMocks(page: Page) {
	// Mock /api/config endpoint
	await page.route('**/api/config', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockConfigData)
		});
	});

	// Mock /api/options endpoint
	await page.route('**/api/options', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockOptionsData)
		});
	});

	// Mock /api/pids endpoint
	await page.route('**/api/pids', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockPidsData)
		});
	});

	// Mock /api/device/info endpoint
	await page.route('**/api/device/info', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				deviceName: 'Test Device',
				version: '1.0.0'
			})
		});
	});
}

/**
 * Setup API mocks that simulate failures
 */
export async function setupFailingApiMocks(page: Page) {
	await page.route('**/api/**', async (route) => {
		await route.abort('failed');
	});
}

/**
 * Clear all API mocks
 */
export async function clearApiMocks(page: Page) {
	await page.unroute('**/api/**');
}
