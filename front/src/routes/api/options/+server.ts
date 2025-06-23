// src/routes/api/options/+server.ts
import { json } from '@sveltejs/kit';

export async function GET() {
	const options = {
		pids: ['RPM', 'TPS', 'MAP', 'IAT', 'CLT'],
		themes: ['Stock ST', 'Stock RS'],
		backgrounds: ['black', 'flare', 'galaxy']
	};

	return json(options);
}
