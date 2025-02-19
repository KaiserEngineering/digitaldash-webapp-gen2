import type { RequestEvent } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';

export async function GET({ params, fetch }: RequestEvent) {
	const { name } = params;

	if (!name) {
		throw error(400, 'Missing image name');
	}

	// Determine whether the request is for themes or backgrounds
	const isTheme = name.startsWith('themes_'); // Assuming theme files start with "themes_"
	let prefix = isTheme ? '/themes/' : '/backgrounds/';

	// If we have a theme, break the name into parts
	let fileUrl = `${prefix}${name}`;

	if (isTheme) {
		// Example: themes_Bar_needle.png.gz → themes/Bar/needle.png.gz
		const parts = name.split('_');

		if (parts.length < 3) {
			console.error(`Invalid theme file name: ${name}`);
			throw error(400, 'Invalid theme file name');
		}

		const theme = parts[1]; // Extract theme name
		const file = parts.slice(2).join('_'); // Extract remaining filename

		// Construct correct URL for fetching static files
		fileUrl = `/themes/${theme}/${encodeURIComponent(file)}`;
	} else {
		// Ensure we do NOT duplicate "/backgrounds/" in the URL
		if (!prefix.endsWith('/')) {
			prefix += '/';
		}
		let modifiedName = name.replace(/^background\//, ''); // Remove extra background prefix if present
		fileUrl = `${prefix}${encodeURIComponent(modifiedName)}`;
	}

	// 🔹 Fetch the file with error handling
	try {
		const res = await fetch(fileUrl);

		if (!res.ok) {
			console.error(`Failed to load ${fileUrl}: ${res.status} ${res.statusText}`);
			throw error(404, 'Image not found');
		}

		const headers = new Headers(res.headers);

		// Extract metadata
		if (name.endsWith('.gz')) {
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
