export const prerender = false;

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// Use a path relative to your project directory
const BACKGROUND_DIR = path.join(process.cwd(), 'static', 'dummy-backgrounds');

export interface ImageInfo {
	size: number;
	type: string;
	lastModified: number;
	url: string;
}

// In-memory store for uploaded images (dummy storage)
let images: Record<string, ImageInfo> = {
	// Preloaded dummy factory images:
	'Flare.png.gz': {
		size: 1024 * 10,
		type: 'image/png',
		lastModified: Date.now() - 1000000,
		url: '/dummy-backgrounds/Flare.png.gz'
	},
	'Galaxy.png.gz': {
		size: 1024 * 15,
		type: 'image/png',
		lastModified: Date.now() - 500000,
		url: '/dummy-backgrounds/Galaxy.png.gz'
	}
};

export async function GET() {
	// Read files from the BACKGROUND_DIR
	const files = fs
		.readdirSync(BACKGROUND_DIR)
		.filter((file) => file.endsWith('.png.gz')) // Only get .png.gz files
		.reduce(
			(acc, file) => {
				const filePath = path.join(BACKGROUND_DIR, file);
				const stats = fs.statSync(filePath);
				acc[file] = {
					size: stats.size,
					lastModified: stats.mtime.getTime(),
					type: 'image/png',
					// Build the public URL for this file
					url: `/dummy-backgrounds/${encodeURIComponent(file)}`
				};
				return acc;
			},
			{} as Record<string, any>
		);

	return json(files);
}

// POST: Upload a new image (expects a FormData with a file and an optional filename)
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();
	const file = data.get('file') as File;

	if (!file) {
		return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
	}
	const filename = data.get('filename')?.toString() || file.name;

	// (Dummy) “upload” by saving file info in the in-memory object.
	images[filename] = {
		size: file.size,
		type: file.type,
		lastModified: Date.now(),
		url: `/dummy-backgrounds/${filename}` // Update to match your folder structure
	};

	return new Response(JSON.stringify({ message: 'Upload successful', filename }), { status: 200 });
};

// DELETE: Remove an image (expects ?filename=... in query)
export const DELETE: RequestHandler = async ({ url }) => {
	const filename = url.searchParams.get('filename');
	if (!filename || !images[filename]) {
		return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
	}
	delete images[filename];
	return new Response(JSON.stringify({ message: 'Delete successful' }), { status: 200 });
};
