import { apiUrl, endpoints, factoryBackgroundImages, factoryThemeImames } from '$lib/config';

export interface ImageData {
	name: string;
	url: string;
	size: number;
	lastModified: number;
	contentType: string;
}

// Unified in-memory image cache
const imageCache = new Map<string, ImageData>();

// List of factory images
const FactoryImages = [...factoryBackgroundImages, ...factoryThemeImames];

export class ImageHandler {
	private customerImageNamesCache: string[] | null = null;
	private lastFetchTime: number | null = null;
	private readonly TTL = 5 * 60 * 1000;

	/**
	 * Resolve endpoint for image name.
	 * Factory images -> static assets; others -> customer endpoint.
	 */
	private getEndpoint(name: string): string {
		return FactoryImages.includes(name)
			? `${apiUrl}${endpoints.factory}`
			: `${apiUrl}${endpoints.customer}`;
	}

	/**
	 * Load image, using cache if available.
	 */
	async loadImage(name: string): Promise<ImageData> {
		if (imageCache.has(name)) return imageCache.get(name)!;

		const url = this.getEndpoint(name) + encodeURIComponent(name);

		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to load image: ${res.statusText}`);

			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);
			const size = parseInt(res.headers.get('content-length') || '0', 10);
			const lastModified = new Date(res.headers.get('last-modified') || Date.now()).getTime();
			const contentType = res.headers.get('content-type') || 'unknown';

			const imageData: ImageData = { name, url: objectUrl, size, lastModified, contentType };
			imageCache.set(name, imageData);

			return imageData;
		} catch (err) {
			console.error(`Image fetch failed for ${name}`, err);
			throw err;
		}
	}

	/**
	 * Clear the image cache, optionally by name.
	 */
	clearCache(name?: string): void {
		if (name) {
			const data = imageCache.get(name);
			if (data) {
				URL.revokeObjectURL(data.url);
				imageCache.delete(name);
				console.debug(`Cleared cache for image: ${name}`);
			}
		} else {
			imageCache.forEach((data) => URL.revokeObjectURL(data.url));
			imageCache.clear();
			console.debug('Cleared entire image cache');
		}
	}

	/**
	 * Return list of factory images (static).
	 */
	getFactoryBackgroundImages(): string[] {
		return factoryBackgroundImages;
	}

	/**
	 * Return list of customer-uploaded image filenames.
	 */
	async getCustomerImageNames(fetchFn: typeof fetch): Promise<string[]> {
		const now = Date.now();

		if (this.customerImageNamesCache && this.lastFetchTime && now - this.lastFetchTime < this.TTL) {
			return this.customerImageNamesCache;
		}

		try {
			const res = await fetchFn(`${apiUrl}/user_images`);
			if (res.ok) {
				const json = await res.json();
				this.customerImageNamesCache = Object.keys(json);
				this.lastFetchTime = now;
			} else {
				console.error('Failed to fetch customer image names:', res.statusText);
				this.customerImageNamesCache = [];
			}
		} catch (err) {
			console.error('Error fetching customer image names:', err);
			this.customerImageNamesCache = [];
		}

		return this.customerImageNamesCache;
	}

	/**
	 * Manually clear customer image name cache.
	 */
	clearCustomerImageNameCache() {
		this.customerImageNamesCache = null;
		this.lastFetchTime = null;
	}
}
