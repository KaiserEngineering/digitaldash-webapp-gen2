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
	// Generate the filename with extension based on file type
	const extension = file.type === 'image/jpeg' ? '.jpg' : '.png';
	const filename = `${file.name}${extension}`;

	const response = await fetch(`${apiUrl}/spiffs/${filename}`, {
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
		throw new Error('Filename is required');
	}

	try {
		const response = await fetch(`${apiUrl}/spiffs?filename=${encodeURIComponent(filename)}`, {
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
	} catch (error) {
		throw error;
	}
}
