import db from './db';
import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';
import { deviceClient } from './deviceClient';
import { useDeviceApi } from '$lib/config';
import { devConfig } from '$local/mock/devDefaults';

const CONFIG_KEY = 'digitaldash';

// Check runtime environment (not build-time)
const isVercelDeployment = typeof process !== 'undefined' && process.env.VERCEL === '1';

// In-memory cache for demo/Vercel deployment (no persistence needed)
let memoryCache: DigitalDash | null = null;

export const configStore = {
	async get(): Promise<DigitalDash | null> {
		if (useDeviceApi) {
			const deviceConfig = await deviceClient.getConfig();
			if (deviceConfig) {
				await configStore.set(deviceConfig);
				return deviceConfig;
			}
		}

		// On Vercel: use in-memory cache
		if (isVercelDeployment) {
			if (memoryCache) {
				return memoryCache;
			}

			// Initialize with demo config
			const demoConfig = structuredClone(devConfig);
			for (const view of demoConfig.view) {
				view.gauge = view.gauge.map((g) => ({
					...g,
					id: crypto.randomUUID()
				}));
			}
			memoryCache = demoConfig;
			return demoConfig;
		}

		// Local development: use SQLite
		if (db) {
			const row = db.prepare('SELECT value FROM config WHERE key = ?').get(CONFIG_KEY) as
				| { value: string }
				| undefined;
			if (row) {
				const parsed = DigitalDashSchema.safeParse(JSON.parse(row.value));
				if (parsed.success) {
					return parsed.data;
				} else {
					console.error('Stored config failed validation:', parsed.error.format());
					console.warn('Falling back to default config due to validation errors');
				}
			}
		}

		// No saved config? use devConfig
		for (const view of devConfig.view) {
			view.gauge = view.gauge.map((g) => ({
				...g,
				id: crypto.randomUUID()
			}));
		}

		await configStore.set(devConfig);
		return devConfig;
	},

	async set(config: unknown): Promise<boolean> {
		const parsed = DigitalDashSchema.safeParse(config);
		if (!parsed.success) {
			console.error('Failed to save config - validation errors:', parsed.error.format());
			return false;
		}

		// On Vercel: just update in-memory cache (demo mode, no persistence)
		if (isVercelDeployment) {
			memoryCache = parsed.data;
			return true;
		}

		// Local development: save to SQLite
		if (db) {
			const json = JSON.stringify(parsed.data);

			db.prepare(
				`INSERT INTO config (key, value) VALUES (?, ?)
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
			).run(CONFIG_KEY, json);
		}

		return true;
	}
};
