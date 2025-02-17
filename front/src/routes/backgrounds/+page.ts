export const prerender = false;

import { apiUrl } from '$lib/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	let customerImages = {};
	let factoryImages = {};

	try {
		// Fetch customer backgrounds from the ESP32 backend
		const response = await fetch(`${apiUrl}/background`);
		if (response.ok) {
			customerImages = await response.json();
		} else {
			console.error("Error fetching customer images:", response.statusText);
		}
	} catch (error) {
		console.error("Failed to fetch customer backgrounds:", error);
	}

	try {
		// Fetch list of factory backgrounds
		const factoryResponse = await fetch('/factory-backgrounds.json');
		const factoryFiles: string[] = factoryResponse.ok ? await factoryResponse.json() : [];

		// Fetch each image file as a Blob
		factoryImages = Object.fromEntries(
			await Promise.all(
				factoryFiles.map(async (filename) => {
					try {
						const response = await fetch(`/backgrounds/${filename}`);
						if (!response.ok) {
							console.warn(`Missing factory image: ${filename}`);
							return [filename, null];
						}
						const blob = await response.blob();

						return [
							filename,
							{
								url: URL.createObjectURL(blob), // Blob URL for client-side use
								size: blob.size,
								type: blob.type,
								lastModified: Date.now()
							}
						];
					} catch (error) {
						console.error(`Error loading factory image ${filename}:`, error);
						return [filename, null];
					}
				})
			)
		);
	} catch (error) {
		console.error("Failed to fetch factory backgrounds:", error);
	}

	return {
		factoryImages,
		customerImages
	};
};
