// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config';
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
	const response = await fetch(`${apiUrl}/image/${file.name}`, {
		method: 'POST',
		body: file,
		headers: {
			'Content-Type': file.type
		}
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const result: UploadResponse = await response.json();

	if (result.filename) {
		// Invalidate and reload the image to get fresh metadata + blob URL
		imageHandler.clearCache(result.filename);
		const fresh = await imageHandler.loadImage(result.filename);

		images[result.filename] = fresh;
	}
	return result;
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
		const response = await fetch(`${apiUrl}/image/${encodeURIComponent(filename)}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error(`Delete failed: ${response.statusText}`);
		}

		imageHandler.clearCache(filename);

		if (images && filename in images) {
			delete images[filename];
		}
	} catch (error) {
		toast.error('Failed to delete image');
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
