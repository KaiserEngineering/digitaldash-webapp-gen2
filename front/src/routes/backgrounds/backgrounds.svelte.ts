// src/routes/backgrounds.ts
import { ImageHandler } from '$lib/image/handler';
import type { ImageData } from '$lib/image/handler';
import { toast } from 'svelte-5-french-toast';

interface UploadResponse {
	success: boolean;
	message?: string;
	filename?: string;
}

const imageHandler = new ImageHandler();

export async function uploadBackground(
	file: File,
	images: { [key: string]: ImageData } = {}
): Promise<UploadResponse> {
	try {
		// Store image locally using localStorage
		const localImage = await imageHandler.uploadLocalImage(file);

		// Update images object with local image data
		const imageData: ImageData = {
			name: localImage.name,
			url: localImage.url,
			size: localImage.size,
			lastModified: localImage.lastModified,
			contentType: localImage.contentType
		};

		images[localImage.name] = imageData;

		return {
			success: true,
			message: 'Image uploaded successfully to local storage',
			filename: localImage.name
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Upload failed';
		toast.error(`Local upload failed: ${errorMessage}`);
		throw new Error(`Local upload failed: ${errorMessage}`);
	}
}

export async function deleteBackground(
	filename: string,
	images: { [key: string]: ImageData } = {}
): Promise<void> {
	if (!filename) {
		toast.error('No filename provided');
		throw new Error('Filename is required');
	}

	// Add a small delay for demo realism
	await new Promise((resolve) => setTimeout(resolve, 300));

	try {
		// Try to delete from local storage
		const deleted = imageHandler.deleteLocalImage(filename);

		if (!deleted) {
			// This is a demo/stock image - clear cache so it shows as failed/empty
			imageHandler.clearCache(filename);

			// Remove from images object
			if (images && filename in images) {
				delete images[filename];
			}

			toast('Demo image cleared. Upload a new image to replace it.', {
				icon: 'ℹ️'
			});

			// Throw error so the UI knows to show empty slot
			throw new Error('DEMO_IMAGE_CLEARED');
		}

		// Remove from images object
		if (images && filename in images) {
			delete images[filename];
		}

		toast.success('Image deleted from local storage');
	} catch (error) {
		// Don't show error toast for intentional demo image clearing
		if (error instanceof Error && error.message === 'DEMO_IMAGE_CLEARED') {
			throw error;
		}

		const errorMessage = error instanceof Error ? error.message : 'Delete failed';
		toast.error(`Failed to delete image: ${errorMessage}`);
		throw error;
	}
}

export async function syncBackgrounds(): Promise<void> {
	try {
		// Simulate sync process with realistic delay
		await new Promise((resolve) => setTimeout(resolve, 1500));
		toast.success('Backgrounds synced successfully');
	} catch (error) {
		toast.error('Failed to sync backgrounds');
		throw error;
	}
}
