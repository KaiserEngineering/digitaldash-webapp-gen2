// +page.ts
import type { PageLoad } from './$types';
import { ImageHandler } from '$lib/image/handler';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const options = parentData.options;

	// Get available background slot names from server options
	const serverSlotNames = options?.view_background || [];

	// Get locally stored images if we're in the browser
	let localImageNames: string[] = [];
	if (browser) {
		try {
			const imageHandler = new ImageHandler();
			const localImages = imageHandler.listLocalImages();
			localImageNames = localImages.map(img => img.name);
		} catch (error) {
			console.warn('Failed to load local images:', error);
		}
	}

	// Combine server slot names with local image names (remove duplicates)
	const allImageNames = Array.from(new Set([...serverSlotNames, ...localImageNames]));

	return {
		slotNames: allImageNames,
		serverSlotNames,
		localImageNames
	};
};
