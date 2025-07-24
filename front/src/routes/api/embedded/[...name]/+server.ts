import { error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export async function GET({ params, fetch, url }) {
	const filename = decodeURIComponent(params?.name ?? '');
	if (!filename) {
		throw error(400, 'Filename is required');
	}

	// Add .png extension if not present
	const imageFile = filename.endsWith('.png') ? filename : `${filename}.png`;

	// For Vercel deployment, fetch the static file via HTTP
	try {
		// Static files are served directly by Vercel at the root URL
		const staticUrl = `${url.origin}/${imageFile}`;
		console.log(`Fetching theme from: ${staticUrl}`);
		
		const res = await fetch(staticUrl);

		if (!res.ok) {
			console.error(`Failed to load theme ${imageFile}: ${res.status} ${res.statusText}`);
			throw error(404, `Theme image not found: ${filename}`);
		}

		const headers = new Headers();
		headers.set('Content-Type', 'image/png');

		return new Response(res.body, {
			status: res.status,
			headers: headers
		});
	} catch (err) {
		console.error(`Error loading theme image: ${err instanceof Error ? err.message : 'Unknown error'}`);
		throw error(500, 'Internal server error loading theme');
	}
}
