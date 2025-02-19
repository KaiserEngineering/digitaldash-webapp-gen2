// src/routes/api/backgrounds/[name]/+server.ts
import { embeddedPrefix, factoryImages } from '@/config';
import type { RequestEvent } from '@sveltejs/kit';

export interface ImageInfo {
	size: number;
	type: string;
	lastModified: number;
	url: string;
}

export async function GET({
	params,
	fetch,
	url
}: {
	params: { name: string };
	fetch: RequestEvent['fetch'];
	url: URL;
}): Promise<Response> {
	const { name } = params;

	if (!name) {
		return new Response('Missing image name', { status: 400 });
	}

	// If we see ${embeddedPrefix}/backgrounds/ in the URL, it's a factory image
	// and we load from /static/backgrounds, if not we load from /dummy-backgrounds
	let prefix = Object.keys(factoryImages).includes(name)? '/backgrounds/' : '/dummy-backgrounds/';

	// Fetch the file from the dummy-backgrounds folder
	const res = await fetch(`${prefix}${encodeURIComponent(name)}`);
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
