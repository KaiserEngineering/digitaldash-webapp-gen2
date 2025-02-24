// src/routes/api/backgrounds/[name]/+server.ts
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs/promises';
import { factoryImages } from '@/config.js';

const BACKGROUND_DIR = path.resolve('static/dummy-backgrounds');

// Supported image extensions (including .gz versions)
const SUPPORTED_EXTENSIONS = new Set([
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.png.gz',
	'.jpg.gz',
	'.jpeg.gz',
	'.gif.gz'
]);

// Dummy storage for uploaded images
let images: Record<string, ImageInfo> = {};

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
	let { name } = params;

	if (!name) {
		throw error(400, 'Missing image name');
	}

	// Remove "background/" prefix if present
	const prefixToRemove = 'background/';
	if (name.startsWith(prefixToRemove)) {
		name = name.slice(prefixToRemove.length);
	}

	let res;

	// If images are factory images return static content
	if (Object.keys(factoryImages).includes(name)) {
		res = await fetch(`/background/${name}`);
	} else {
		// For customer images, load from dummy-backgrounds
		const prefix = '/dummy-backgrounds/';
		res = await fetch(`${prefix}${encodeURIComponent(name)}`);
	}

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

/** Helper function to get full file extension (including .gz) */
function getFullExtension(filename: string): string {
	const ext = path.extname(filename).toLowerCase();
	if (ext === '.gz') {
		// Check for double extensions like .png.gz
		const nameWithoutGz = filename.slice(0, -3); // Remove .gz
		const secondExt = path.extname(nameWithoutGz).toLowerCase();
		if (secondExt) return secondExt + '.gz';
	}
	return ext;
}

/** POST Handler - Upload a new background image */
export async function POST({ request }) {
	// Instead of parsing formData, read the raw binary data
	const buffer = Buffer.from(await request.arrayBuffer());

	// Assume you still have a way to get the filename (e.g., via URL or a query parameter)
	const url = new URL(request.url);
	const filename = url.searchParams.get('filename');
	if (!filename) {
		throw error(400, 'No filename provided');
	}

	// Validate file extension as before...
	const fileName = filename.toLowerCase();
	const fullExt = getFullExtension(fileName);
	if (!SUPPORTED_EXTENSIONS.has(fullExt)) {
		throw error(400, `Invalid file type. Allowed: ${Array.from(SUPPORTED_EXTENSIONS).join(', ')}`);
	}

	const filePath = path.join(BACKGROUND_DIR, fileName);

	try {
		await fs.writeFile(filePath, buffer);

		// Emulate slow network if needed
		await new Promise((resolve) => setTimeout(resolve, 1000));

		return json(
			{
				message: `File uploaded successfully: ${fileName}`,
				url: `/api/backgrounds/${fileName}`,
				filename: fileName
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('POST Error:', err);
		throw error(500, 'Failed to upload file');
	}
}

// ** DELETE: Remove an image (expects ?filename=... in query) **
export const DELETE: RequestHandler = async ({ url }) => {
	const filename = url.searchParams.get('filename');
	if (!filename) {
		throw error(404, 'File not provided');
	}
	const filePath = path.join(BACKGROUND_DIR, filename);
	try {
		await fs.unlink(filePath);
		// Optionally update your in-memory images object if needed:
		delete images[filename];
		return json({ message: 'Delete successful' });
	} catch (err) {
		console.error(err);
		throw error(500, 'Failed to delete file');
	}
};
