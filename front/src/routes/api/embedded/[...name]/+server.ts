import { error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export async function GET({ params, fetch, url }) {
	const filename = decodeURIComponent(params?.name ?? '');
	if (!filename) {
		throw error(400, 'Filename is required');
	}

	// Add .png extension if not present
	const imageFile = filename.endsWith('.png') ? filename : `${filename}.png`;

	// For Vercel deployment, serve from built static files
	try {
		const fs = await import('fs/promises');
		const path = await import('path');

		// In Vercel, static files are in the same directory as the built app
		const staticPath = path.join(process.cwd(), imageFile);

		try {
			const file = await fs.readFile(staticPath);
			return new Response(file, {
				status: 200,
				headers: { 'Content-Type': 'image/png' }
			});
		} catch (fsErr) {
			console.error(`Failed to load theme ${imageFile} from ${staticPath}: ${fsErr.message}`);
			throw error(404, `Theme image not found: ${filename}`);
		}
	} catch (err) {
		console.error(
			`Error loading theme image: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
		throw error(500, 'Internal server error loading theme');
	}
}
