// src/routes/api/config/+server.ts
import { json } from '@sveltejs/kit';

export async function GET() {
	return json({ ver: '1.0.0' });
}
