// src/lib/imageHandler.ts
import { apiUrl, endpoints } from '$lib/config';

export interface ImageData {
	name: string;
	url: string;
	size: number;
	lastModified: number;
	contentType: string;
}

// Simple in-memory cache for images.
const imageCache = new Map<string, ImageData>();

export class ImageHandler {
	constructor() {}

	/**
	 * Determine the correct endpoint based on the image name.
	 * - Factory images are served as static assets (e.g. from /dummy-backgrounds/)
	 * - User images are served via an API endpoint.
	 */
	determineEndpoint(name: string): string {
		console.log('Determining endpoint for:', name);

		// Check if the image is a factory image based on the filename prefix
		if (name.startsWith('stock_') || name.startsWith('bar_')) {
			return `/theme/`;
		} else if (name.startsWith('background_')) {
			return `/background/`;
		} else {
			return `${apiUrl}${endpoints.customer}`;
		}
	}

	/**
	 * Loads an image from the appropriate endpoint.
	 * Checks the in-memory cache first; if not cached, fetches from the backend.
	 */
	async loadImage(name: string): Promise<ImageData> {
		if (imageCache.has(name)) {
			return imageCache.get(name)!;
		}

		const endpoint = this.determineEndpoint(name);
		const url = endpoint + encodeURI(name);

		// Fetch the image.
		try {
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`Failed to load image ${name}: ${res.statusText}`);
			}

			// Create an object URL from the fetched blob.
			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);

			// Extract metadata from response headers.
			const size = parseInt(res.headers.get('content-length') || '0', 10);
			const lastModifiedHeader = res.headers.get('last-modified');
			const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader).getTime() : Date.now();

			const imageData: ImageData = {
				name,
				url: objectUrl,
				size,
				lastModified,
				contentType: res.headers.get('content-type') || 'unknown'
			};

			// Cache the result.
			imageCache.set(name, imageData);

			return imageData;
		} catch (error) {
			console.error(`Failed to load image ${name}: ${error}`);
			throw error;
		}
	}

	/**
	 * Clears the image cache.
	 * Optionally clears a single image's cache, revoking its object URL.
	 */
	clearImageCache(name?: string): void {
		if (name) {
			const data = imageCache.get(name);
			if (data) {
				URL.revokeObjectURL(data.url);
			}
			imageCache.delete(name);
			console.debug(`Clearing cache for ${name}`);
		} else {
			imageCache.forEach((data) => {
				URL.revokeObjectURL(data.url);
			});
			imageCache.clear();
		}
	}
}
