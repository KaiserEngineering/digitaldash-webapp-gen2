import type { PageLoad } from './$types';
import { building } from '$app/environment';

export const load: PageLoad = async ({ fetch }) => {
	// During build/prerender, return a default value
	if (building) {
		return { ver: 'loading...' };
	}

	try {
		const res = await fetch('/api/firmware-version');
		if (!res.ok) {
			console.warn('Firmware version fetch failed:', res.status);
			return { ver: 'unknown' };
		}

		const { ver } = await res.json();
		return { ver };
	} catch (err) {
		console.error('Error fetching firmware version:', err);
		return { ver: 'unknown' };
	}
};
