// src/routes/api/reset/+server.ts
import { json } from '@sveltejs/kit';
import { deviceClient } from '$local/server/deviceClient';

export async function POST() {
	try {
		const success = await deviceClient.resetDevice();
		if (!success) {
			return json({ error: 'Failed to reset Digital Dash' }, { status: 500 });
		}
		return json({ message: 'Digital Dash reset successfully' });
	} catch (err) {
		console.error('Reset API error:', err);
		return json({ error: 'Reset request failed' }, { status: 500 });
	}
}