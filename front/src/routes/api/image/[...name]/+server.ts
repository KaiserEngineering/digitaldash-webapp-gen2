import { error, json } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

const validSlots = [
	'User1',
	'User2',
	'User3',
	'User4',
	'User5',
	'User6',
	'User7',
	'User8',
	'User9',
	'User10',
	'User11',
	'User12',
	'User13',
	'User14',
	'User15'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate a simple placeholder image for demo mode
function generatePlaceholderImage(name: string): Buffer {
	// Create a simple PNG placeholder (1x1 transparent pixel)
	const png = Buffer.from([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
		0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
		0x49, 0x48, 0x44, 0x52, // IHDR
		0x00, 0x00, 0x00, 0x01, // width: 1
		0x00, 0x00, 0x00, 0x01, // height: 1
		0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
		0x1f, 0x15, 0xc4, 0x89, // CRC
		0x00, 0x00, 0x00, 0x0a, // IDAT chunk length
		0x49, 0x44, 0x41, 0x54, // IDAT
		0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
		0xe2, 0x21, 0xbc, 0x33, // CRC
		0x00, 0x00, 0x00, 0x00, // IEND chunk length
		0x49, 0x45, 0x4e, 0x44, // IEND
		0xae, 0x42, 0x60, 0x82  // CRC
	]);
	return png;
}

export async function GET({ params, url }) {
	const { name } = params;
	// Remove .png extension if it exists to avoid double extensions
	const base = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!name || !validSlots.includes(base)) {
		throw error(400, 'Invalid slot name');
	}

	// For Vercel deployment, serve the static file directly
	try {
		const staticUrl = new URL(`/dummy-backgrounds/${base}.png`, url.origin);
		const res = await fetch(staticUrl.toString());
		
		if (!res.ok) {
			// Fallback to placeholder if file doesn't exist
			const placeholder = generatePlaceholderImage(base);
			return new Response(placeholder, {
				status: 200,
				headers: { 'Content-Type': 'image/png' }
			});
		}

		return new Response(res.body, {
			status: res.status,
			headers: { 'Content-Type': 'image/png' }
		});
	} catch (err) {
		// Fallback to placeholder on any error
		const placeholder = generatePlaceholderImage(base);
		return new Response(placeholder, {
			status: 200,
			headers: { 'Content-Type': 'image/png' }
		});
	}
}

export async function POST({ request, params }) {
	// For Vercel deployment, simulate upload success but don't actually store files
	if (isVercelDeployment) {
		const { name } = params;
		if (!name) {
			throw error(400, 'Missing filename in URL');
		}

		const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
		if (!validSlots.includes(baseName)) {
			throw error(400, 'Invalid slot name');
		}

		const buffer = Buffer.from(await request.arrayBuffer());
		
		// Validate file size
		if (buffer.length > MAX_FILE_SIZE) {
			throw error(413, 'File too large. Maximum size is 10MB');
		}

		// Basic image format validation (check for PNG magic bytes)
		if (
			buffer.length < 8 ||
			!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		) {
			throw error(400, 'Invalid PNG file format');
		}

		// Simulate successful upload for demo
		return json(
			{
				message: 'Demo: File upload simulated successfully',
				filename: `${baseName}.png`,
				url: `/api/image/${baseName}`
			},
			{
				status: 201
			}
		);
	}

	// Original POST logic for local development
	const { name } = params;
	if (!name) {
		throw error(400, 'Missing filename in URL');
	}

	// Remove .png extension if it exists to avoid double extensions
	const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!validSlots.includes(baseName)) {
		throw error(400, 'Invalid slot name');
	}

	const fileName = `${baseName}.png`;
	const filePath = path.join(BACKGROUND_DIR, fileName);

	try {
		const buffer = Buffer.from(await request.arrayBuffer());

		// Validate file size
		if (buffer.length > MAX_FILE_SIZE) {
			throw error(413, 'File too large. Maximum size is 10MB');
		}

		// Basic image format validation (check for PNG magic bytes)
		if (
			buffer.length < 8 ||
			!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
		) {
			throw error(400, 'Invalid PNG file format');
		}

		// Ensure directory exists
		await fs.mkdir(BACKGROUND_DIR, { recursive: true });

		await fs.writeFile(filePath, buffer);

		return json(
			{
				message: 'File uploaded successfully',
				filename: fileName,
				url: `/api/image/${baseName}`
			},
			{
				status: 201
			}
		);
	} catch (err) {
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Failed to upload file');
	}
}

export async function DELETE({ params }) {
	// For Vercel deployment, simulate delete success
	if (isVercelDeployment) {
		const { name } = params;
		const base = name.endsWith('.png') ? name.slice(0, -4) : name;

		if (!name || !validSlots.includes(base)) {
			throw error(400, 'Invalid slot name');
		}

		return json({ message: 'Demo: File deletion simulated successfully' });
	}

	// Original DELETE logic for local development
	const { name } = params;
	// Remove .png extension if it exists to avoid double extensions
	const base = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!name || !validSlots.includes(base)) {
		throw error(400, 'Invalid slot name');
	}

	try {
		await fs.unlink(path.join(BACKGROUND_DIR, base + '.png'));
		return json({ message: 'File deleted successfully' });
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw error(404, 'Image not found');
		}
		throw error(500, 'Failed to delete image');
	}
}
