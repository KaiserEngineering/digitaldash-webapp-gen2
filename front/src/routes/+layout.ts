import { DigitalDashSchema } from '$schemas/digitaldash';
import { configStore } from '$lib/stores/configStore';
import { getOptions } from '$lib/stores/optionsCache';
import { pidsStore } from '$lib/stores/PIDsStore';
import { recoveryStore } from '$lib/stores/recoveryMode';
import { offlineStore, isOnline } from '$lib/stores/offlineStore';
import { get } from 'svelte/store';

export const load = async ({ fetch }) => {
	const issues: string[] = [];
	const configPromise = fetch('/api/config')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('Config fetch failed'))))
		.then((raw) => {
			const parsed = DigitalDashSchema.safeParse(raw);
			if (!parsed.success) {
				console.error('Invalid config schema:', parsed.error);
				issues.push('Invalid configuration schema detected');
				throw new Error('Invalid config schema');
			}
			configStore.setConfig(parsed.data);
			return parsed.data;
		})
		.catch((error) => {
			console.error('Config fetch failed:', error);
			
			// Try offline data if available
			const offlineData = get(offlineStore);
			if (offlineData.config && !get(isOnline)) {
				console.log('Using cached config while offline');
				configStore.setConfig(offlineData.config);
				return offlineData.config;
			}
			
			issues.push('Failed to connect to device configuration');
			return null;
		});

	const optionsPromise = getOptions(fetch).catch((error) => {
		console.error('Options fetch failed:', error);
		issues.push('Failed to load device options');
		return {};
	});

	const pidsPromise = fetch('/api/pids')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('PID fetch failed'))))
		.then((pids) => {
			pidsStore.setPIDs(pids);
			return pids;
		})
		.catch((error) => {
			console.error('PIDs fetch failed:', error);
			
			// Try offline data if available
			const offlineData = get(offlineStore);
			if (offlineData.pids && !get(isOnline)) {
				console.log('Using cached PIDs while offline');
				pidsStore.setPIDs(offlineData.pids);
				return offlineData.pids;
			}
			
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
		options: results[1].status === 'fulfilled' ? results[1].value : {},
		pids: results[2].status === 'fulfilled' ? results[2].value : []
	};
};
