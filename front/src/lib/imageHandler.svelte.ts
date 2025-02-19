// src/lib/imageHandler.ts
import { factoryImageNames, embeddedPrefix, apiUrl } from '$lib/config';

export interface ImageData {
	name: string;
	url: string;
	type: 'factory' | 'user';
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
		if (factoryImageNames.includes(name)) {
			if (embeddedPrefix) {
				return `/${embeddedPrefix}/background/`;
			} else {
				return `/background/`;
			}
		} else {
			return `/background/`;
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
		const url = apiUrl + endpoint + encodeURIComponent(name);

		// Fetch the image.
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

		// If the endpoint is the static folder, mark it as a factory image.
		const type: 'factory' | 'user' = endpoint === '/dummy-backgrounds/' ? 'factory' : 'user';

		const imageData: ImageData = {
			name,
			url: objectUrl,
			type,
			size,
			lastModified,
			contentType: res.headers.get('content-type') || 'unknown'
		};

		// Cache the result.
		imageCache.set(name, imageData);

		return imageData;
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
		} else {
			imageCache.forEach((data) => {
				URL.revokeObjectURL(data.url);
			});
			imageCache.clear();
		}
	}
}
