import { error } from '@sveltejs/kit';

export async function GET({ params, fetch }) {
	const filename = params?.name;

	if (!filename) {
		throw error(400, 'Filename is required');
	}

	try {
		const res = await fetch(`/static/${filename}`);

		if (!res.ok) {
			console.error(`Failed to load ${filename}: ${res.status} ${res.statusText}`);
			throw error(404, 'Image not found');
		}

		const headers = new Headers(res.headers);

		// Extract metadata
		if (filename.endsWith('.gz')) {
			headers.set('Content-Encoding', 'gzip');
			headers.set('Content-Type', 'image/png'); // Assuming PNG files
		} else {
			headers.set('Content-Type', res.headers.get('content-type') || 'image/png');
		}

		// Return metadata + stream response
		return new Response(res.body, {
			status: res.status,
			headers: headers
		});
	} catch (err) {
		console.error(`Error loading image: ${(err as any).message}`);
		throw error(500, 'Internal server error');
	}
}
