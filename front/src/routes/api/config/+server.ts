// src/routes/api/config/+server.ts
import { configStore } from '$local/server/configStore';
import { json } from '@sveltejs/kit';
import { DigitalDashSchema } from '$schemas/digitaldash';
import { deviceClient } from '$local/server/deviceClient';
import { useDeviceApi } from '$lib/config';

export async function GET() {
	const config = await configStore.get();
	if (!config) return json({ error: 'Config not found' }, { status: 404 });
	return json(config);
}

export async function POST({ request }) {
	try {
		const data = await request.json();

		// Validate the data but still try to save even with warnings
		const validation = DigitalDashSchema.safeParse(data);
		if (!validation.success) {
			console.warn('Config validation warnings:', validation.error.format());
			// Still attempt to save - let the configStore handle it
		}

		const success = await configStore.set(data);
		if (!success) {
			console.error('Failed to save config to store');
			return json({ error: 'Failed to save configuration', success: false }, { status: 200 }); // 200 to not crash the app
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in POST /api/config:', error);
		return json({ error: 'Internal error saving config', success: false }, { status: 200 }); // 200 to not crash the app
	}
}

export async function PATCH({ request }) {
	try {
		const data = await request.json();

		const parsed = DigitalDashSchema.safeParse(data);
		if (!parsed.success) {
			console.warn('PATCH validation warnings:', parsed.error.format());
			const errorMessages =
				parsed.error.issues?.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ') ||
				'Unknown validation error';
			console.warn('Validation issues:', errorMessages);
			// Continue with raw data instead of failing
		}

		const config = parsed.success ? parsed.data : data;

		// Safely add IDs to gauges if view array exists
		if (config.view && Array.isArray(config.view)) {
			for (const view of config.view) {
				if (view.gauge && Array.isArray(view.gauge)) {
					view.gauge = view.gauge.map((g) => ({
						...g,
						id: g.id ?? crypto.randomUUID()
					}));
				}
			}
		}

		if (useDeviceApi) {
			const success = await deviceClient.saveConfig(config);
			if (!success) {
				return json({ error: 'Failed to save config to device' }, { status: 500 });
			}
		} else {
			await configStore.set(config);
		}

		return json({ message: 'Configuration saved successfully' });
	} catch (err) {
		console.error('Error parsing PATCH request:', err);
		return json({ error: 'Invalid request' }, { status: 400 });
	}
}
