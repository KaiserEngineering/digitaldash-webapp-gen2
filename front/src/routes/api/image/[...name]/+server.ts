import { error, json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const STATIC_DIR = path.join(process.cwd(), 'static');
const BACKGROUND_DIR = path.join(STATIC_DIR, 'dummy-backgrounds');
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

export async function GET({ params }) {
	const { name } = params;
	// Remove .png extension if it exists to avoid double extensions
	const base = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!name || !validSlots.includes(base)) {
		throw error(400, 'Invalid slot name');
	}

	const filePath = path.join(BACKGROUND_DIR, base + '.png');

	try {
		const file = await fs.readFile(filePath);
		return new Response(file, {
			status: 200,
			headers: { 'Content-Type': 'image/png' }
		});
	} catch (err) {
		if (err.code === 'ENOENT') {
			throw error(404, 'Image not found');
		}
		throw error(500, 'Failed to read image');
	}
}

export async function POST({ request, params }) {
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
