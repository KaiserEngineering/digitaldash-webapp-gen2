import db from './db';
import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';
import { deviceClient } from './deviceClient';
import { useDeviceApi } from '$lib/config';
import { devConfig } from '$lib/mock/devDefaults';

const CONFIG_KEY = 'digitaldash';

export const configStore = {
	async get(): Promise<DigitalDash | null> {
		if (useDeviceApi) {
			const deviceConfig = await deviceClient.getConfig();
			if (deviceConfig) {
				await configStore.set(deviceConfig);
				return deviceConfig;
			}
		}

		// fallback: get from local SQLite
		const row = db.prepare('SELECT value FROM config WHERE key = ?').get(CONFIG_KEY) as
			| { value: string }
			| undefined;
		if (row) {
			const parsed = DigitalDashSchema.safeParse(JSON.parse(row.value));
			if (parsed.success) return parsed.data;
		}

		// no saved config? use devConfig
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
		if (!parsed.success) return false;

		const json = JSON.stringify(parsed.data);

		db.prepare(
			`INSERT INTO config (key, value) VALUES (?, ?)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
		).run(CONFIG_KEY, json);

		return true;
	}
};
