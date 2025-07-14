import { DigitalDashSchema } from '$schemas/digitaldash';
import { configStore } from '@/config/configStore';
import { getOptions } from '@/config/optionsCache';
import { pidsStore } from '@/config/PIDsStore';
import { recoveryStore } from '$lib/stores/recoveryMode';

export const load = async ({ fetch }) => {
	const issues: string[] = [];
	const configPromise = fetch('/api/config')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('Config fetch failed'))))
		.then((raw) => {
			const parsed = DigitalDashSchema.safeParse(raw);
			if (!parsed.success) {
				console.error('Invalid config schema, using fallback:', parsed.error);
				issues.push('Invalid configuration schema detected');
				// Return fallback config that allows firmware update
				const fallbackConfig = {
					view: [
						{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' },
						{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' },
						{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' }
					],
					alert: [],
					dynamic: []
				};
				configStore.setConfig(fallbackConfig);
				return fallbackConfig;
			}
			configStore.setConfig(parsed.data);
			return parsed.data;
		})
		.catch((error) => {
			console.error('Config fetch failed completely, using fallback:', error);
			issues.push('Failed to connect to device configuration');
			// Return fallback config that allows firmware update
			const fallbackConfig = {
				view: [
					{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' },
					{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' },
					{ enabled: false, num_gauges: 0, background: 'User1', gauge: [], textColor: 'white' }
				],
				alert: [],
				dynamic: []
			};
			configStore.setConfig(fallbackConfig);
			return fallbackConfig;
		});

	const optionsPromise = getOptions(fetch).catch((error) => {
		console.error('Options fetch failed:', error);
		// Return empty options object as fallback
		return {};
	});

	const pidsPromise = fetch('/api/pids')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('PID fetch failed'))))
		.then((pids) => {
			pidsStore.setPIDs(pids);
			return pids;
		})
		.catch((error) => {
			console.error('PIDs fetch failed, using fallback:', error);
			issues.push('Failed to load PID definitions');
			// Return fallback PIDs that allows basic functionality
			const fallbackPids = [
				{
					desc: 'Engine Speed',
					label: 'RPM',
					units: ['rpm'],
					min: [0],
					max: [8000],
					decimals: [0]
				},
				{
					desc: 'Vehicle Speed',
					label: 'Speed',
					units: ['mph', 'km/h'],
					min: [0, 0],
					max: [180, 270],
					decimals: [0, 0]
				},
				{ desc: 'Engine Load', label: 'Load', units: ['%'], min: [0], max: [100], decimals: [1] }
			];
			pidsStore.setPIDs(fallbackPids);
			return fallbackPids;
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
