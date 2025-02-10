// src/routes/upload/+server.ts
export const prerender = false;

import { json, type RequestEvent } from '@sveltejs/kit';

// Typed GET endpoint
export async function GET(event: RequestEvent) {
	const searchParams = event.url.searchParams;
	console.log(searchParams);

	return json({ params: Object.fromEntries(searchParams.entries()) });
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
		console.log(`Received file upload via FormData:`);
		console.log(`Name: ${name}`);
		console.log(`File size: ${bytes.length} bytes`);
		const hexDump = Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join(' ');
		console.log(`Hex Dump: ${hexDump}`);

		// Return a dummy JSON response.
		return json({
			message: 'File uploaded successfully (dummy response)',
			id: 'dummy123',
			url: `https://example.com/uploads/dummy123-${name}`
		});
	} catch (error) {
		console.error('Error processing file upload:', error);
		return json({ error: 'Error processing file upload' }, { status: 400 });
	}
}
