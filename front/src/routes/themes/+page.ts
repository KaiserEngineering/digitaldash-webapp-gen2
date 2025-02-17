export const prerender = false;

import type { PageLoad } from './$types';
import { apiUrl } from '$lib/config';

export const load: PageLoad = async ({ fetch }) => {
	// Fetch factory images from a static JSON file
	const factoryRes = await fetch('/factory-themes.json');
	const factoryImages = await factoryRes.json();

	// Fetch user-uploaded images from the ESP32 API
	const customerRes = await fetch(`${apiUrl}/theme`);
	const customerImages = customerRes.ok ? await customerRes.json() : {};

	return {
		factoryImages,
		customerImages
	};
};
