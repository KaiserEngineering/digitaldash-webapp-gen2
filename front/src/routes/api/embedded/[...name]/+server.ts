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

		// Try different possible locations for static files in Vercel
		const possiblePaths = [
			path.join(process.cwd(), imageFile),
			path.join(process.cwd(), '.vercel', 'output', 'static', imageFile),
			path.join(process.cwd(), '.svelte-kit', 'output', 'client', imageFile),
			path.join('/tmp', imageFile),
			path.join('/var/task', '.svelte-kit', 'output', 'client', imageFile)
		];

		console.log(`Looking for theme file: ${imageFile}`);
		console.log(`Process cwd: ${process.cwd()}`);

		for (const staticPath of possiblePaths) {
			try {
				console.log(`Trying path: ${staticPath}`);
				const file = await fs.readFile(staticPath);
				console.log(`Successfully loaded theme from: ${staticPath}`);
				return new Response(file, {
					status: 200,
					headers: { 'Content-Type': 'image/png' }
				});
			} catch (fsErr) {
				console.log(`Path ${staticPath} failed: ${fsErr.message}`);
				continue;
			}
		}

		console.error(`Failed to load theme ${imageFile} from any of the attempted paths`);
		throw error(404, `Theme image not found: ${filename}`);
	} catch (err) {
		console.error(
			`Error loading theme image: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
		throw error(500, 'Internal server error loading theme');
	}
}
