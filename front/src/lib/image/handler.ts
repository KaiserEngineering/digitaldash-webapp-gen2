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

export class ImageHandler {
	/**
	 * Load a background image from /api/image/:slot
	 */
	async loadImage(name: string): Promise<ImageData> {
		if (backgroundCache.has(name)) {
			const cached = backgroundCache.get(name);
			if (cached === null) throw new Error(`Previously failed to load image: ${name}`);
			return cached!;
		}

		const url = `${apiUrl}/image/${encodeURIComponent(name)}.png`;
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
	 */
	async loadTheme(name: string): Promise<ImageData> {
		if (themeCache.has(name)) return themeCache.get(name)!;

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
			console.debug(`Theme fetch failed for '${name}'`, err);
			throw err;
		}
	}

	/**
	 * Shared fetch logic
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
			console.debug(`Image fetch failed for '${name}'`, err);
			throw err;
		}
	}

	/**
	 * Preload background images
	 */
	async preloadImages(names: string[]): Promise<void> {
		await Promise.allSettled(
			names.map((name) =>
				this.loadImage(name).catch((err) => console.warn(`Preload failed for ${name}:`, err))
			)
		);
	}

	/**
	 * Preload theme images
	 */
	async preloadThemes(names: string[]): Promise<void> {
		await Promise.allSettled(
			names.map((name) =>
				this.loadTheme(name).catch((err) => console.warn(`Theme preload failed for ${name}:`, err))
			)
		);
	}

	/**
	 * Clear all image caches
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
	}
}
