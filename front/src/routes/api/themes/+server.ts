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
		// The file is available as a Blob
		const fileBlob = formData.get('file');
		// You can also get other fields as needed

		console.log('Received file upload via FormData:');
		console.log('Name:', name);
		console.log('File:', fileBlob);
		// For the dummy endpoint, you might not process the fileBlob at all

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
