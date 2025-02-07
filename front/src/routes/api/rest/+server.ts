export const prerender = false;

import { json, type RequestEvent } from '@sveltejs/kit';

// Typed GET endpoint
export async function GET(event: RequestEvent) {
	const searchParams = event.url.searchParams;
	console.log(searchParams);

	return json({ params: Object.fromEntries(searchParams.entries()) });
}

// Typed POST endpoint
export async function POST(event: RequestEvent) {
	try {
		const body: Record<string, unknown> = await event.request.json();
		console.log(body);
		return json(body);
	} catch (error) {
		console.error('Invalid JSON body:', error);
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}
}
