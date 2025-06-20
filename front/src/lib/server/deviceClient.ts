// src/lib/server/deviceClient.ts

import { DigitalDashSchema, type DigitalDashConfig } from '$schemas/digitaldash';

const DEVICE_URL = 'http://192.168.4.1';

export const deviceClient = {
	async getConfig(): Promise<DigitalDashConfig | null> {
		try {
			const res = await fetch(`${DEVICE_URL}/config`);
			if (!res.ok) throw new Error(`Device error: ${res.statusText}`);

			const data = await res.json();
			const parsed = DigitalDashSchema.safeParse(data);
			if (!parsed.success) {
				console.error('Invalid config from device:', parsed.error);
				return null;
			}

			return parsed.data;
		} catch (err) {
			console.error('Failed to fetch from device:', err);
			return null;
		}
	},

	async saveConfig(config: unknown): Promise<boolean> {
		const parsed = DigitalDashSchema.safeParse(config);
		if (!parsed.success) {
			console.error('Invalid config before saving:', parsed.error);
			return false;
		}

		try {
			const res = await fetch(`${DEVICE_URL}/config`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed.data)
			});
			return res.ok;
		} catch (err) {
			console.error('Failed to save to device:', err);
			return false;
		}
	}
};
