import { error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export async function GET({ params, fetch, url }) {
	const filename = decodeURIComponent(params?.name ?? '');
	if (!filename) {
		throw error(400, 'Filename is required');
	}

	// Add .png extension if not present
	const imageFile = filename.endsWith('.png') ? filename : `${filename}.png`;

	// For Vercel deployment, redirect to the static file
	const staticUrl = `${url.origin}/${imageFile}`;
	console.log(`Redirecting theme to: ${staticUrl}`);
	return Response.redirect(staticUrl, 302);
}
