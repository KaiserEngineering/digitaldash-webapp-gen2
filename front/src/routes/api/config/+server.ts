// src/routes/api/config/+server.ts
import { configStore } from '$local/server/configStore';
import { error, json } from '@sveltejs/kit';
import { DigitalDashSchema } from '$schemas/digitaldash';
import { deviceClient } from '$local/server/deviceClient';
import { useDeviceApi } from '$lib/config';

export async function GET() {
	const config = await configStore.get();
	if (!config) return json({ error: 'Config not found' }, { status: 404 });
	return json(config);
}

export async function POST({ request }) {
	const data = await request.json();
	const success = await configStore.set(data);
	if (!success) return json({ error: 'Invalid config' }, { status: 400 });
	return json({ success: true });
}

export async function PATCH({ request }) {
	try {
		const data = await request.json();

		const parsed = DigitalDashSchema.safeParse(data);
		if (!parsed.success) {
			console.error('Validation failed:', parsed.error.format());
			return json({ error: 'Invalid configuration schema' }, { status: 400 });
		}

		const config = parsed.data;

		for (const view of config.view) {
			view.gauge = view.gauge.map((g) => ({
				...g,
				id: g.id ?? crypto.randomUUID()
			}));
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
