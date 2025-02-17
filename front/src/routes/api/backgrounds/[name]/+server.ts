// src/routes/api/backgrounds/[name]/+server.ts
import type { RequestEvent } from '@sveltejs/kit';

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
		return new Response('Missing image name', { status: 400 });
	}
	// Fetch the file from the dummy-backgrounds folder
	const res = await fetch(`/dummy-backgrounds/${encodeURIComponent(name)}`);
	if (!res.ok) {
		return new Response('Image not found', { status: 404 });
	}

	// Create a new Headers instance based on the fetched response headers
	const headers = new Headers(res.headers);

	// If the file is gzipped, set the proper headers
	if (name.endsWith('.gz')) {
		// Tell the browser this response is gzip-compressed
		headers.set('Content-Encoding', 'gzip');
		// Set the appropriate MIME type based on the original file type.
		// For example, if dog.png.gz is a gzipped PNG image, set it to image/png.
		headers.set('Content-Type', 'image/png');
	} else {
		// For non-gzipped files, ensure there is a content-type header.
		headers.set('Content-Type', res.headers.get('content-type') || 'image/png');
	}

	return new Response(res.body, {
		status: res.status,
		headers: headers
	});
}
