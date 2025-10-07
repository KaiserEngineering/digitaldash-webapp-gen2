export interface LocalImageData {
	name: string;
	url: string; // base64 data URL
	size: number;
	lastModified: number;
	contentType: string;
}

const LOCAL_STORAGE_KEY = 'digitaldash_local_images';
const MAX_STORAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

export class LocalImageHandler {
	/**
	 * Upload and store an image locally in localStorage
	 * @param file - The file to upload and store
	 * @returns Promise<LocalImageData> - The stored image data
	 * @throws Error if storage fails or exceeds size limits
	 */
	async uploadImage(file: File): Promise<LocalImageData> {
		// Validate file type
		if (!file.type.startsWith('image/')) {
			throw new Error('Only image files are allowed');
		}

		// Check file size (5MB individual limit)
		if (file.size > 5 * 1024 * 1024) {
			throw new Error('Image file must be smaller than 5MB');
		}

		// Convert to base64
		const base64Url = await this._fileToBase64(file);
		
		// Remove .png extension if it exists to match server behavior
		const baseName = file.name.endsWith('.png') ? file.name.slice(0, -4) : file.name.replace(/\.[^/.]+$/, "");

		const imageData: LocalImageData = {
			name: baseName,
			url: base64Url,
			size: file.size,
			lastModified: file.lastModified || Date.now(),
			contentType: file.type
		};

		// Check total storage size before adding
		const existingData = this._getStoredImages();
		const totalSize = Object.values(existingData).reduce((sum, img) => sum + img.size, 0);
		
		if (totalSize + file.size > MAX_STORAGE_SIZE) {
			throw new Error('Storage limit exceeded. Please delete some images first.');
		}

		// Store in localStorage
		existingData[baseName] = imageData;
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));

		return imageData;
	}

	/**
	 * Load a locally stored image by name
	 * @param name - The name of the image to load (without .png extension)
	 * @returns Promise<LocalImageData> - The loaded image data
	 * @throws Error if the image doesn't exist locally
	 */
	async loadLocalImage(name: string): Promise<LocalImageData> {
		const existingData = this._getStoredImages();
		
		// Remove .png extension if it exists
		const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
		
		const imageData = existingData[baseName];
		if (!imageData) {
			throw new Error(`Local image '${name}' not found`);
		}

		return imageData;
	}

	/**
	 * Delete a locally stored image
	 * @param name - The name of the image to delete
	 * @returns boolean - True if deleted, false if not found
	 */
	deleteLocalImage(name: string): boolean {
		const existingData = this._getStoredImages();
		
		// Remove .png extension if it exists
		const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
		
		if (existingData[baseName]) {
			delete existingData[baseName];
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
			return true;
		}
		
		return false;
	}

	/**
	 * List all locally stored images
	 * @returns LocalImageData[] - Array of all stored images
	 */
	listLocalImages(): LocalImageData[] {
		const existingData = this._getStoredImages();
		return Object.values(existingData);
	}

	/**
	 * Check if an image exists locally
	 * @param name - The name of the image to check
	 * @returns boolean - True if image exists locally
	 */
	hasLocalImage(name: string): boolean {
		const existingData = this._getStoredImages();
		const baseName = name.endsWith('.png') ? name.slice(0, -4) : name;
		return baseName in existingData;
	}

	/**
	 * Clear all locally stored images
	 */
	clearLocalImages(): void {
		localStorage.removeItem(LOCAL_STORAGE_KEY);
	}

	/**
	 * Get storage usage information
	 * @returns Object with storage statistics
	 */
	getStorageInfo(): { used: number; total: number; remaining: number; count: number } {
		const existingData = this._getStoredImages();
		const used = Object.values(existingData).reduce((sum, img) => sum + img.size, 0);
		
		return {
			used,
			total: MAX_STORAGE_SIZE,
			remaining: MAX_STORAGE_SIZE - used,
			count: Object.keys(existingData).length
		};
	}

	/**
	 * Convert File to base64 data URL
	 * @private
	 */
	private _fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Get stored images from localStorage
	 * @private
	 */
	private _getStoredImages(): Record<string, LocalImageData> {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch (error) {
			console.warn('Failed to parse stored images, resetting:', error);
			localStorage.removeItem(LOCAL_STORAGE_KEY);
			return {};
		}
	}
}