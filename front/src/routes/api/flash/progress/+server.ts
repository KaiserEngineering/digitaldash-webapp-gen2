import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Mock flash progress for development
let mockProgress = 0;
let mockComplete = false;
let mockStartTime: number | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
	if (dev) {
		// Development mock - simulate flash progress
		if (mockStartTime === null) {
			mockStartTime = Date.now();
		}

		const elapsed = Date.now() - mockStartTime;
		const duration = 30000; // 30 seconds total

		if (elapsed < duration && !mockComplete) {
			mockProgress = Math.min(Math.floor((elapsed / duration) * 100), 99);
			return json({
				percentage: mockProgress,
				message: mockProgress === 0 ? 'Entering bootloader mode' : 'Flashing firmware',
				complete: false
			});
		} else if (!mockComplete) {
			// Complete the flash
			mockComplete = true;
			mockProgress = 100;
			return json({
				percentage: 100,
				message: 'Resetting STM32',
				complete: true
			});
		} else {
			// Reset for next flash
			mockProgress = 0;
			mockComplete = false;
			mockStartTime = null;
			return json({
				percentage: 100,
				message: 'Flash complete',
				complete: true
			});
		}
	}

	// Production - forward to embedded device
	try {
		const response = await fetch('/api/flash/progress');

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Flash progress error:', error);
		return json(
			{
				percentage: 0,
				message: 'Progress unavailable',
				complete: false,
				error: 'Failed to get flash progress'
			},
			{ status: 500 }
		);
	}
};
