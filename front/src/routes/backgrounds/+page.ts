export const prerender = false;

import { apiUrl, factoryImages } from '$lib/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	let customerImages: { [key: string]: any } = {};

	try {
		// Fetch customer backgrounds from the ESP32 backend
		const response = await fetch(`${apiUrl}/user_images`);
		if (response.ok) {
			customerImages = await response.json();
		} else {
			console.error('Error fetching customer images:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to fetch customer backgrounds:', error);
	}

	return {
		factoryImages,
		customerImages
	};
};
