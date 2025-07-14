import { apiUrl } from '$lib/config';
import type { Image } from 'lucide-svelte';

export interface ImageData {
	name: string;
	url: string;
	size: number;
	lastModified: number;
	contentType: string;
}

const backgroundCache = new Map<string, ImageData>();
const themeCache = new Map<string, ImageData>();
// Track themes that failed to load - themes are embedded in firmware so they never change
const failedThemes = new Set<string>();

export class ImageHandler {
	/**
	 * Load a background image from /api/image/:slot
	 * @param name - The name of the image to load
	 * @returns Promise<ImageData> - The loaded image data including URL and metadata
	 * @throws Error if the image fails to load or doesn't exist
	 */
	async loadImage(name: string): Promise<ImageData> {
		if (backgroundCache.has(name)) {
			const cached = backgroundCache.get(name);
			if (cached === null) throw new Error(`Previously failed to load image: ${name}`);
			return cached!;
		}

		// Remove .png extension if it exists to avoid double extensions
		const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
		const url = `${apiUrl}/image/${encodeURIComponent(baseName)}.png`;
		try {
			const imageData = await this._fetchAndCacheImage(name, url, backgroundCache);
			return imageData;
		} catch (err) {
			backgroundCache.set(name, null as unknown as ImageData);
			throw err;
		}
	}

	/**
	 * Load a theme image from /api/embedded/:name
	 * @param name - The name of the theme to load
	 * @returns Promise<ImageData> - The loaded theme data including URL and metadata
	 * @throws Error if the theme fails to load or doesn't exist
	 */
	async loadTheme(name: string): Promise<ImageData> {
		if (themeCache.has(name)) return themeCache.get(name)!;

		// Don't retry failed themes - themes are embedded in firmware and never change
		if (failedThemes.has(name)) {
			throw new Error(`Theme '${name}' is not available in firmware`);
		}

		const url = `${apiUrl}/embedded/${encodeURIComponent(name)}.png`;

		try {
			const res = await fetch(url);
			if (!res.ok)
				throw new Error(`Failed to load theme '${name}': ${res.status} ${res.statusText}`);

			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);
			const size = parseInt(res.headers.get('content-length') || '0', 10);
			const lastModified = new Date(res.headers.get('last-modified') || Date.now()).getTime();
			const contentType = res.headers.get('content-type') || 'unknown';

			const imageData: ImageData = { name, url: objectUrl, size, lastModified, contentType };
			themeCache.set(name, imageData);

			return imageData;
		} catch (err) {
			console.warn(`Theme '${name}' not found in firmware - will not retry`, err);
			// Mark as permanently failed since themes are embedded in firmware
			failedThemes.add(name);
			throw err;
		}
	}

	/**
	 * Shared fetch logic for loading and caching images
	 * @param name - The name of the image
	 * @param url - The URL to fetch the image from
	 * @param cache - The cache to store the image data in
	 * @returns Promise<ImageData> - The loaded and cached image data
	 * @throws Error if the fetch fails or response is not ok
	 */
	private async _fetchAndCacheImage(
		name: string,
		url: string,
		cache: Map<string, ImageData>
	): Promise<ImageData> {
		try {
			const res = await fetch(url);
			if (!res.ok)
				throw new Error(`Failed to load image '${name}': ${res.status} ${res.statusText}`);

			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);
			const size = parseInt(res.headers.get('content-length') || '0', 10);
			const lastModified = new Date(res.headers.get('last-modified') || Date.now()).getTime();
			const contentType = res.headers.get('content-type') || 'unknown';

			const imageData: ImageData = {
				name,
				url: objectUrl,
				size,
				lastModified,
				contentType
			};

			cache.set(name, imageData);
			return imageData;
		} catch (err) {
			throw err;
		}
	}

	/**
	 * Preload background images for better performance
	 * @param names - Array of image names to preload
	 * @returns Promise<void> - Resolves when all preloads complete (success or failure)
	 */
	async preloadImages(names: string[]): Promise<void> {
		await Promise.allSettled(
			names.map((name) =>
				this.loadImage(name).catch((err) => console.warn(`Preload failed for ${name}:`, err))
			)
		);
	}

	/**
	 * Preload theme images for better performance
	 * @param names - Array of theme names to preload
	 * @returns Promise<void> - Resolves when all preloads complete (success or failure)
	 */
	async preloadThemes(names: string[]): Promise<void> {
		await Promise.allSettled(
			names.map((name) =>
				this.loadTheme(name).catch((err) => console.warn(`Theme preload failed for ${name}:`, err))
			)
		);
	}

	/**
	 * Clear image caches and revoke object URLs to prevent memory leaks
	 * @param name - Optional specific image name to clear. If not provided, clears all caches
	 */
	clearCache(name?: string): void {
		const clear = (cache: Map<string, ImageData>) => {
			if (name) {
				const data = cache.get(name);
				if (data) {
					URL.revokeObjectURL(data.url);
					cache.delete(name);
				}
			} else {
				cache.forEach((data) => URL.revokeObjectURL(data.url));
				cache.clear();
			}
		};

		clear(backgroundCache);
		clear(themeCache);

		// Only clear failed themes cache if specific name provided
		// Otherwise keep failed themes cached to avoid retries
		if (name) {
			failedThemes.delete(name);
		}
	}
}
