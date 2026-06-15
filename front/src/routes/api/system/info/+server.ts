import { json } from '@sveltejs/kit';

export const prerender = false;

// Mock temp for dev env.
export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 150));

	return json({
		cpu_temp_c: 42.5
	});
}
