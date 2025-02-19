export const prerender = false;

import { apiUrl, embeddedPrefix, factoryImageNames } from '$lib/config';
import { ImageHandler } from '@/imageHandler.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	let customerImages: { [key: string]: any } = {};
	let factoryImages: { [key: string]: { size: number; lastModified: number; type: string } } = {};
	const imageHandler = new ImageHandler();

	try {
		// Fetch customer backgrounds from the ESP32 backend
		const response = await fetch(`${apiUrl}/backgrounds`);
		if (response.ok) {
			customerImages = await response.json();
		} else {
			console.error('Error fetching customer images:', response.statusText);
		}
	} catch (error) {
		console.error('Failed to fetch customer backgrounds:', error);
	}

	const results = await Promise.all(
		factoryImageNames.map(async (filename: string) => {
			try {
				const image = await imageHandler.loadImage(filename);

				return [
					filename,
					{
						size: image.size,
						lastModified: image.lastModified,
						type: image.contentType
					}
				];
			} catch (error) {
				console.error('Failed to fetch factory background:', error);
				return [filename, null];
			}
		})
	);

	// Convert results array to an object
	factoryImages = Object.fromEntries(results.filter(([_, value]) => value !== null));

	return {
		factoryImages,
		customerImages
	};
};
