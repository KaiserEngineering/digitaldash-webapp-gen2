import { getConfig } from '$lib/stores/configStore';
import { getOptions, type OptionsData } from '$lib/stores/optionsCache';
import { getPids } from '$lib/stores/PIDsStore';
import { recoveryStore } from '$lib/stores/recoveryMode';

export const load = async ({ fetch, url }) => {
	const issues: string[] = [];

	// Debug mode only available in development
	if (import.meta.env.DEV && url.searchParams.get('debug') === 'recovery') {
		issues.push('Debug mode: Simulated device connection failure');
		issues.push('Failed to connect to device configuration');
		issues.push('Failed to load PID definitions');
		recoveryStore.enterRecoveryMode(issues);
		return { config: null, options: {} as OptionsData, pids: [] };
	}

	const configPromise = getConfig(fetch).catch((error) => {
		console.error('Config fetch failed:', error);
		issues.push('Failed to connect to device configuration');
		return null;
	});

	const optionsPromise = getOptions(fetch).catch((error) => {
		console.error('Options fetch failed:', error);
		issues.push('Failed to load device options');
		return {} as OptionsData;
	});

	const pidsPromise = getPids(fetch).catch((error) => {
		console.error('PIDs fetch failed:', error);
		issues.push('Failed to load PID definitions');
		return [];
	});

	// Wait for all promises to resolve and check for recovery mode
	const results = await Promise.allSettled([configPromise, optionsPromise, pidsPromise]);

	// Update recovery store based on any failures
	if (issues.length > 0) {
		recoveryStore.enterRecoveryMode(issues);
	} else {
		recoveryStore.exitRecoveryMode();
	}

	return {
		config: results[0].status === 'fulfilled' ? results[0].value : null,
		options: results[1].status === 'fulfilled' ? results[1].value : ({} as OptionsData),
		pids: results[2].status === 'fulfilled' ? results[2].value : []
	};
};
