export const prerender = false;

import { json, type RequestEvent } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const BACKGROUND_DIR = 'static/dummy-backgrounds'; // Path to dummy background images

export async function GET() {
	const files = fs
		.readdirSync(BACKGROUND_DIR)
		.filter((file) => file.endsWith('.png.gz')) // Only get .png.gz files
		.reduce((acc, file) => {
			const filePath = path.join(BACKGROUND_DIR, file);
			const stats = fs.statSync(filePath);

			acc[file] = {
				size: stats.size,
				lastModified: stats.mtime.getTime(), // Timestamp in milliseconds
				type: 'image/png'
			};

			return acc;
		}, {} as Record<string, any>); // Ensure it's an object

	return json(files);
}

export async function POST(event: RequestEvent) {
	try {
		const formData = await event.request.formData();
		const name = formData.get('name');
		const fileBlob = formData.get('file');

		// Validate that we got a file blob.
		if (!(fileBlob instanceof Blob)) {
			throw new Error('No valid file provided.');
		}

		// Convert the blob to an ArrayBuffer, then to a Uint8Array.
		const arrayBuffer = await fileBlob.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// Log the size and raw bytes in hexadecimal format.
		console.log(`Received background file upload:`);
		console.log(`Name: ${name}`);
		console.log(`File size: ${bytes.length} bytes`);
		const hexDump = Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join(' ');
		console.log(`Hex Dump: ${hexDump}`);

		// Return a dummy JSON response.
		return json({
			message: 'Background uploaded successfully (dummy response)',
			id: 'dummy-bg-123',
			url: `https://example.com/uploads/dummy-bg-123-${name}`
		});
	} catch (error) {
		console.error('Error processing background upload:', error);
		return json({ error: 'Error processing background upload' }, { status: 400 });
	}
}
