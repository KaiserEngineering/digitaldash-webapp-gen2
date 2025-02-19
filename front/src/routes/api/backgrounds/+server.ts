export const prerender = false;

import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// Only allow loading from /static/dummy-backgrounds/
const BACKGROUND_DIR = path.join(process.cwd(), 'static', 'dummy-backgrounds');

// Supported image extensions (including .gz versions)
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.png.gz', '.jpg.gz', '.jpeg.gz', '.gif.gz'];

export interface ImageInfo {
	size: number;
	type: string;
	lastModified: number;
	url: string;
}

// Dummy storage for uploaded images
let images: Record<string, ImageInfo> = {};

// ** GET: List all images in `/dummy-backgrounds/` **
export async function GET() {
	try {
		const files = fs
			.readdirSync(BACKGROUND_DIR)
			.filter((file) => SUPPORTED_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)))
			.reduce((acc, file) => {
				const filePath = path.join(BACKGROUND_DIR, file);
				const stats = fs.statSync(filePath);
				const ext = path.extname(file).toLowerCase();

				// Determine MIME type
				let type = 'application/octet-stream';
				if (ext.startsWith('.png')) type = 'image/png';
				else if (ext.startsWith('.jpg') || ext.startsWith('.jpeg')) type = 'image/jpeg';
				else if (ext.startsWith('.gif')) type = 'image/gif';

				acc[file] = {
					size: stats.size,
					lastModified: stats.mtime.getTime(),
					type: type,
					url: `/dummy-backgrounds/${encodeURIComponent(file)}` // Ensure URL-safe encoding
				};
				return acc;
			}, {} as Record<string, ImageInfo>);

		return json(files);
	} catch (err) {
		console.error('Error reading dummy-backgrounds directory:', err);
		throw error(500, 'Failed to read background images');
	}
}

// ** POST: Upload a new image (expects FormData with "file" and optional "filename") **
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();
	const file = data.get('file') as File;

	if (!file) {
		throw error(400, 'No file uploaded');
	}

	const filename = data.get('filename')?.toString() || file.name;
	const ext = path.extname(filename).toLowerCase();

	// Validate file type
	if (!SUPPORTED_EXTENSIONS.includes(ext)) {
		throw error(400, 'Unsupported file type');
	}

	// Simulate file storage (actual saving logic needed for persistent storage)
	images[filename] = {
		size: file.size,
		type: file.type,
		lastModified: Date.now(),
		url: `/dummy-backgrounds/${filename}`
	};

	return json({ message: 'Upload successful', filename });
};

// ** DELETE: Remove an image (expects ?filename=... in query) **
export const DELETE: RequestHandler = async ({ url }) => {
	const filename = url.searchParams.get('filename');

	if (!filename || !images[filename]) {
		throw error(404, 'File not found');
	}

	delete images[filename]; // Remove from memory storage

	return json({ message: 'Delete successful' });
};
