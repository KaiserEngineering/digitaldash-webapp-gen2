// src/lib/server/deviceClient.ts

import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';

const DEVICE_URL = 'http://192.168.4.1';

export const deviceClient = {
	async getConfig(): Promise<DigitalDash | null> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

			const res = await fetch(`${DEVICE_URL}/config`, {
				signal: controller.signal,
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				}
			});

			clearTimeout(timeoutId);

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Unknown error');
				console.error(`Device HTTP error ${res.status}: ${res.statusText}`, errorText);
				throw new Error(`Device error: ${res.status} ${res.statusText}`);
			}

			// Check if response is actually JSON
			const contentType = res.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				const responseText = await res.text();
				console.error('Device returned non-JSON response:', responseText);
				throw new Error('Device returned non-JSON response');
			}

			let data;
			try {
				data = await res.json();
			} catch (jsonErr) {
				const responseText = await res.text().catch(() => 'Unable to read response');
				console.error('Failed to parse JSON from device:', jsonErr, 'Response:', responseText);
				throw new Error('Invalid JSON response from device');
			}

			const parsed = DigitalDashSchema.safeParse(data);
			if (!parsed.success) {
				console.error('Invalid config schema from device:', parsed.error.format());
				console.error('Raw data from device:', data);
				return null;
			}

			return parsed.data;
		} catch (err) {
			if (err instanceof Error) {
				if (err.name === 'AbortError') {
					console.error('Device request timed out after 5 seconds');
				} else if (err.message.includes('fetch')) {
					console.error('Network error connecting to device:', err.message);
				} else {
					console.error('Device client error:', err.message);
				}
			} else {
				console.error('Unknown device client error:', err);
			}
			return null;
		}
	},

	async saveConfig(config: unknown): Promise<boolean> {
		const parsed = DigitalDashSchema.safeParse(config);
		if (!parsed.success) {
			console.error('Invalid config before saving:', parsed.error.format());
			return false;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for save

			const res = await fetch(`${DEVICE_URL}/config`, {
				method: 'POST',
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(parsed.data)
			});

			clearTimeout(timeoutId);

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Unknown error');
				console.error(`Device save error ${res.status}: ${res.statusText}`, errorText);
				return false;
			}

			return true;
		} catch (err) {
			if (err instanceof Error) {
				if (err.name === 'AbortError') {
					console.error('Device save request timed out after 10 seconds');
				} else if (err.message.includes('fetch')) {
					console.error('Network error saving to device:', err.message);
				} else {
					console.error('Device save error:', err.message);
				}
			} else {
				console.error('Unknown device save error:', err);
			}
			return false;
		}
	}
};
