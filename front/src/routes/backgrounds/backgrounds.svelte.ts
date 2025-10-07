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

	try {
		// Delete from local storage
		const deleted = imageHandler.deleteLocalImage(filename);
		
		if (!deleted) {
			throw new Error('Image not found in local storage');
		}

		// Remove from images object
		if (images && filename in images) {
			delete images[filename];
		}

		toast.success('Image deleted from local storage');
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Delete failed';
		toast.error(`Failed to delete image: ${errorMessage}`);
		throw error;
	}
}

export async function syncBackgrounds(): Promise<void> {
	try {
		const response = await fetch(`${apiUrl}/sync`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Sync failed: ${response.statusText}`);
		}

		toast.success('Backgrounds synced successfully');
	} catch (error) {
		toast.error('Failed to sync backgrounds');
		throw error;
	}
}
