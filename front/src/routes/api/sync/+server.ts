// src/routes/api/sync/+server.ts
import { json } from '@sveltejs/kit';
import { deviceClient } from '$local/server/deviceClient';

export async function POST() {
	try {
		const success = await deviceClient.syncBackgrounds();
		if (!success) {
			return json({ error: 'Failed to sync backgrounds' }, { status: 500 });
		}
		return json({ message: 'Backgrounds synced successfully' });
	} catch (err) {
		console.error('Sync API error:', err);
		return json({ error: 'Sync request failed' }, { status: 500 });
	}
}
