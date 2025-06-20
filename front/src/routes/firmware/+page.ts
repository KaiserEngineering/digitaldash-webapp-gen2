// +page.ts or +page.server.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/firmware-version');
	if (!res.ok) {
		throw new Error('Failed to fetch firmware version');
	}

	const { ver } = await res.json();

	return {
		ver
	};
};
