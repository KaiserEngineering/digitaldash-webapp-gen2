// src/routes/api/options/+server.ts
import { json } from '@sveltejs/kit';

export async function GET() {
	const options = {
		pids: ['RPM', 'TPS', 'MAP', 'IAT', 'CLT'],
		themes: ['stock_st', 'stock_rs'],
		backgrounds: ['black.png', 'flare.png', 'galaxy.png']
	};

	return json(options);
}
