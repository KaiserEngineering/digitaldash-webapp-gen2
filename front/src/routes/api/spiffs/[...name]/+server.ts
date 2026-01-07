import { json, error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export const prerender = false;

// Handle file uploads to /api/spiffs/{filename}
// Matches C implementation: POST /api/spiffs/* extracts filename from URI
export async function POST({ request, params }) {
	const filename = params.name;

	if (!filename) {
		throw error(400, 'No filename provided');
	}

	// Validate file type (.bin for firmware, .png for backgrounds)
	const isValidFile = filename.endsWith('.bin') || filename.endsWith('.png');
	if (!isValidFile) {
		throw error(400, 'Only .bin and .png files are allowed');
	}

	const buffer = await request.arrayBuffer();

	// Validate file size (max 4MB to match C implementation)
	const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
	if (buffer.byteLength > MAX_FILE_SIZE) {
		throw error(413, 'File too large. Maximum size is 4MB');
	}

	if (buffer.byteLength === 0) {
		throw error(400, 'No file content');
	}

	// Simulate upload processing time
	await new Promise((resolve) => setTimeout(resolve, 1800));

	// Mock successful upload response
	return json({
		message: isVercelDeployment
			? 'Demo: File upload simulated successfully'
			: 'File uploaded successfully',
		filename: filename,
		size: buffer.byteLength
	});
}
