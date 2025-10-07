import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, fetch }) => {
	if (dev) {
		// Development mock - simulate web firmware upload
		const buffer = await request.arrayBuffer();
		const file = new File([buffer], 'web-firmware.bin', {
			type: 'application/octet-stream'
		});

		console.log(`Mock: Uploading web firmware - ${file.name} (${file.size} bytes)`);

		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 2000));

		return json({
			success: true,
			message: 'Web firmware uploaded successfully',
			size: file.size
		});
	}

	// Production - forward to embedded device
	try {
		const response = await fetch('/api/firmware/web', {
			method: 'POST',
			body: request.body,
			headers: {
				'Content-Type': 'application/octet-stream'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Web firmware upload error:', error);
		return json({ error: 'Failed to upload web firmware' }, { status: 500 });
	}
};
