import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { isVercelDeployment } from '$lib/config';

export const POST: RequestHandler = async ({ request, fetch }) => {
	if (dev || isVercelDeployment) {
		// Development/Demo mock - simulate starting STM flash
		console.log('Mock: Starting STM32 firmware flash');
		return json({ message: 'STM32 firmware update started (demo mode)' });
	}

	// Production - forward to embedded device
	try {
		const response = await fetch('/api/firmware/stm', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('STM firmware flash error:', error);
		return json({ error: 'Failed to start STM32 firmware flash' }, { status: 500 });
	}
};
