// src/routes/api/backgrounds/[name]/+server.ts
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export interface ImageInfo {
	size: number;
	type: string;
	lastModified: number;
	url: string;
}

export async function GET({
	params,
	fetch
}: {
	params: { name: string };
	fetch: RequestEvent['fetch'];
}): Promise<Response> {
	const { name } = params;

	if (!name) {
		throw error(400, 'Missing image name');
	}

	// Load customer images from /static/dummy-backgrounds/
	const prefix = '/dummy-backgrounds/';

	// Fetch the file from SvelteKit's static directory
	const res = await fetch(`${prefix}${encodeURIComponent(name)}`);

	if (!res.ok) {
		throw error(404, 'Image not found');
	}

	// Create a new Headers instance based on the fetched response headers
	const headers = new Headers(res.headers);

	// If the file is gzipped, set the proper headers
	if (name.endsWith('.gz')) {
		headers.set('Content-Encoding', 'gzip');
		headers.set('Content-Type', 'image/png'); // Assuming PNG files
	} else {
		headers.set('Content-Type', res.headers.get('content-type') || 'image/png');
	}

	return new Response(res.body, {
		status: res.status,
		headers: headers
	});
}
