export const prerender = false;

import { json, error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// Define the mock image storage location
const BACKGROUND_DIR = path.join(process.cwd(), 'static', 'dummy-backgrounds');

// Supported image file extensions
const SUPPORTED_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.png.gz',
	'.jpg.gz',
	'.jpeg.gz',
	'.gif.gz'
];

export interface ImageInfo {
	size: number;
	type: string;
	lastModified: number;
	url: string;
}

// ** GET: List all images in `/dummy-backgrounds/` **
export async function GET() {
	try {
		// Ensure directory exists
		if (!fs.existsSync(BACKGROUND_DIR)) {
			fs.mkdirSync(BACKGROUND_DIR, { recursive: true });
		}

		const files = fs
			.readdirSync(BACKGROUND_DIR)
			.filter((file) => SUPPORTED_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)))
			.reduce(
				(acc, file) => {
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
						url: `/dummy-backgrounds/${encodeURIComponent(file)}`
					};
					return acc;
				},
				{} as Record<string, ImageInfo>
			);

		return json(files);
	} catch (err) {
		console.error('Error reading dummy-backgrounds directory:', err);
		throw error(500, 'Failed to read background images');
	}
}
