import { error, json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const STATIC_DIR = path.join(process.cwd(), 'static');
const BACKGROUND_DIR = path.join(STATIC_DIR, 'dummy-backgrounds');
const validSlots = ['User1', 'User2', 'User3'];

export async function GET({ params }) {
	const { name } = params;
	// Remove .png extension if it exists to avoid double extensions
	const base = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!name || !validSlots.includes(base)) {
		throw error(400, 'Invalid slot name');
	}

	const filePath = path.join(BACKGROUND_DIR, base + '.png');
	const file = await fs.readFile(filePath);

	return new Response(file, {
		status: 200,
		headers: { 'Content-Type': 'image/png' }
	});
}

export async function POST({ request, params }) {
	const { name } = params;
	if (!name) {
		throw error(400, 'Missing filename in URL');
	}

	// Remove .png extension if it exists to avoid double extensions
	const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
	const fileName = `${baseName}.png`;

	const filePath = path.join(BACKGROUND_DIR, fileName);

	const buffer = Buffer.from(await request.arrayBuffer());
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
}

export async function DELETE({ params }) {
	const { name } = params;
	// Remove .png extension if it exists to avoid double extensions
	const base = name.endsWith('.png') ? name.slice(0, -4) : name;

	if (!name || !validSlots.includes(base)) {
		throw error(400, 'Invalid slot name');
	}

	await fs.unlink(path.join(BACKGROUND_DIR, base + '.png'));
	return json({ message: 'File deleted successfully' });
}
