import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, fetch }) => {
	if (dev) {
		// Development mock - simulate starting bootloader flash
		console.log('Mock: Starting STM32 bootloader flash');
		return json({ message: 'STM32 bootloader update started' });
	}

	// Production - forward to embedded device
	try {
		const response = await fetch('/api/firmware/bootloader', {
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
		console.error('Bootloader flash error:', error);
		return json(
			{ error: 'Failed to start STM32 bootloader flash' },
			{ status: 500 }
		);
	}
};