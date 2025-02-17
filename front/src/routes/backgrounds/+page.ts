export const prerender = false;

import { apiUrl } from '$lib/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	let customerImages: { [key: string]: any } = {};
	let factoryImages: { [key: string]: { size: number; lastModified: number; type: string } } = {};

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

	const factoryImageNames = ['Flare.png.gz', 'Galaxy.png.gz'];

	const results = await Promise.all(
		factoryImageNames.map(async (filename: string) => {
			try {
				const response = await fetch(`/backgrounds/${filename}`);
				if (response.ok) {
					// We don't really need to call blob() here since we're getting metadata
					const lastModifiedHeader = response.headers.get('last-modified');
					return [
						filename,
						{
							size: parseInt(response.headers.get('content-length') || '0', 10),
							lastModified: lastModifiedHeader
								? new Date(lastModifiedHeader).getTime()
								: Date.now(),
							type: response.headers.get('content-type') || 'unknown'
						}
					];
				} else {
					console.error('Error fetching factory image:', response.statusText);
					return [filename, null];
				}
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
