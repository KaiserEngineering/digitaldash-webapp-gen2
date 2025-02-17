export const prerender = false;

import { apiUrl } from '$lib/config';
import type { PageLoad } from './$types';

const FACTORY_DIR = 'static/backgrounds';

export const load: PageLoad = async ({ fetch }) => {
	// Fetch customer backgrounds from the ESP32 backend
	const response = await fetch(`${apiUrl}/background`);
	const customerImages = response.ok ? await response.json() : {};

	const factoryResponse = await fetch('/factory-backgrounds.json');
	const factoryFiles: string[] = factoryResponse.ok ? await factoryResponse.json() : [];

	// Fetch each image file as a Blob
	const factoryImages = Object.fromEntries(
		await Promise.all(
			factoryFiles.map(async (filename) => {
				const response = await fetch(`/backgrounds/${filename}`);
				const blob = response.ok ? await response.blob() : null;

				if (!blob) return [filename, null];

				return [
					filename,
					{
						url: URL.createObjectURL(blob), // Blob URL for client-side use
						size: blob.size,
						type: blob.type,
						lastModified: Date.now()
					}
				];
			})
		)
	);

	return {
		factoryImages,
		customerImages
	};
};
