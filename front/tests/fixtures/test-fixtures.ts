import { test as base } from '@playwright/test';

/**
 * Mock configuration data for testing
 */
export const mockConfig = {
	general: [
		{
			EE_Version: 1,
			Splash: 3
		}
	],
	view: [
		{
			name: 'Test View 1',
			background: 'default'
		},
		{
			name: 'Test View 2',
			background: 'default'
		}
	],
	alert: [
		{
			enable: 'Enabled',
			pid: 'RPM',
			compare: '>',
			threshold: '5000'
		},
		{
			enable: 'Disabled',
			pid: 'SPEED',
			compare: '<',
			threshold: '10'
		}
	],
	dynamic: [
		{
			enable: 'Enabled',
			priority: 'High',
			pid: 'TEMP',
			compare: '>',
			threshold: '200',
			view_index: 1
		},
		{
			enable: 'Enabled',
			priority: 'Low',
			view_index: 0
		}
	]
};

/**
 * Extended test fixture type
 */
type TestFixtures = {
	mockData: typeof mockConfig;
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
	mockData: async ({}, use) => {
		await use(mockConfig);
	}
});

export { expect } from '@playwright/test';
