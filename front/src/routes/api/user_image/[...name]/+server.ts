import { error, json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const BACKGROUND_DIR = path.join(process.cwd(), 'static/dummy-backgrounds');
// Supported image extensions
const SUPPORTED_EXTENSIONS = new Set([
	'.png',
	'.jpg',
	'.jpeg',
	'.gif'
]);

export async function GET({ params, fetch }) {
	const { name } = params;
	if (!name) {
		throw error(400, 'Missing image name');
	}
	let res = await fetch(`/static/dummy-backgrounds/${name}`);

	if (!res.ok) {
		throw error(404, 'Image not found');
	}
	// Create a new Headers instance based on the fetched response headers
	const headers = new Headers(res.headers);

	headers.set('Content-Type', res.headers.get('content-type') || 'image/png');

	return new Response(res.body, {
		status: res.status,
		headers: headers
	});
}

export async function POST({ params, request}) {
	const { name } = params;
	// Instead of parsing formData, read the raw binary data
	const buffer = Buffer.from(await request.arrayBuffer());
	// Assume you still have a way to get the filename (e.g., via URL or a query parameter)
	const url = new URL(request.url);
	if (!name) {
		throw error(400, 'No filename provided');
	}

	// Validate file extension as before...
	const fileName = name.toLowerCase();
	const fullExt = path.extname(fileName).toLowerCase();
	if (!SUPPORTED_EXTENSIONS.has(fullExt)) {
		throw error(400, `Invalid file type. Allowed: ${Array.from(SUPPORTED_EXTENSIONS).join(', ')}`);
	}

	const filePath = path.join(BACKGROUND_DIR, fileName);

	try {
		fs.writeFile(filePath, buffer);

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

export async function DELETE({ params }) {
	const { name } = params;

	if (!name) {
		throw error(400, 'Filename is required');
	}

	const filePath = path.join(BACKGROUND_DIR, name);

	await fs.unlink(filePath);
	return json({ message: 'File deleted successfully' });
}
