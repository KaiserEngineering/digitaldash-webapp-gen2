import { error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export async function GET({ params, fetch, url }) {
	const filename = decodeURIComponent(params?.name ?? '');
	if (!filename) {
		throw error(400, 'Filename is required');
	}

	// Add .png extension if not present
	const imageFile = filename.endsWith('.png') ? filename : `${filename}.png`;

	// For Vercel deployment, serve the static file directly
	try {
		const staticUrl = new URL(`/${imageFile}`, url.origin);
		const res = await fetch(staticUrl.toString());

		if (!res.ok) {
			console.error(`Failed to load theme ${imageFile}: ${res.status} ${res.statusText}`);
			throw error(404, `Theme image not found: ${filename}`);
		}

		const headers = new Headers(res.headers);
		headers.set('Content-Type', res.headers.get('content-type') || 'image/png');

		return new Response(res.body, {
			status: res.status,
			headers: headers
		});
	} catch (err) {
		console.error(`Error loading theme image: ${err instanceof Error ? err.message : 'Unknown error'}`);
		throw error(500, 'Internal server error loading theme');
	}
}
