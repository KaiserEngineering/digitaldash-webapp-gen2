import { apiUrl, factoryBackgroundImages } from '$lib/config';
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async ({ fetch }) => {
	let customerImageNames: string[] = [];

	try {
		// Fetch only customer image filenames, NOT the full images
		const response = await fetch(`${apiUrl}/user_images`);
		if (response.ok) {
			customerImageNames = Object.keys(await response.json());
		} else {
			console.error('Error fetching customer image filenames:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to fetch customer image filenames:', error);
	}

	// Factory images (predefined list)
	return {
		factoryImageNames: factoryBackgroundImages,
		customerImageNames // Only return filenames (no image data)
	};
};
