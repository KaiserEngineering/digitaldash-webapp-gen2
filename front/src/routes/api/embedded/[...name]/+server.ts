import { error } from '@sveltejs/kit';

export async function GET({ params, fetch }) {
	const filename = decodeURIComponent(params?.name ?? '');
	if (!filename) {
		throw error(400, 'Filename is required');
	}

	try {
		const res = await fetch(`/${filename}`);

		if (!res.ok) {
			console.error(`Failed to load ${filename}: ${res.status} ${res.statusText}`);
			throw error(404, 'Image not found');
		}

		const headers = new Headers(res.headers);
		headers.set('Content-Type', res.headers.get('content-type') || 'image/png');

		// Return metadata + stream response
		return new Response(res.body, {
			status: res.status,
			headers: headers
		});
	} catch (err) {
		console.error(`Error loading image: ${err instanceof Error ? err.message : 'Unknown error'}`);
		throw error(500, 'Internal server error');
	}
}
