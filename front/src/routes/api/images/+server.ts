export const prerender = false;

import { json } from '@sveltejs/kit';

export async function GET() {
	return json(['User1', 'User2', 'User3']);
}
