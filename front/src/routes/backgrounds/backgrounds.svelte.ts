// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config';
import { ImageHandler } from '$lib/image/handler';
import type { ImageData } from '$lib/image/handler';
import { upload, UPLOAD_LIMITS } from '$lib/utils/upload';

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

	const result = await upload<UploadResponse>(`${apiUrl}/spiffs/${filename}`, file, {
		maxSize: UPLOAD_LIMITS.IMAGE,
		context: 'Background upload'
	});

	if (!result.success) {
		throw new Error(result.error || 'Upload failed');
	}

	if (result.data?.filename) {
		// Invalidate and reload the image to get fresh metadata + blob URL
		imageHandler.clearCache(result.data.filename);
		const fresh = await imageHandler.loadImage(result.data.filename);
		images[result.data.filename] = fresh;
	}

	return result.data || { success: true };
}

export async function deleteBackground(
	filename: string,
	images: { [key: string]: ImageData } = {}
): Promise<void> {
	if (!filename) {
		throw new Error('Filename is required');
	}

	// Always append .png extension since backgrounds are always PNG
	const fullFilename = `${filename}.png`;
	const response = await fetch(`${apiUrl}/spiffs?filename=${encodeURIComponent(fullFilename)}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Unknown error' }));
		throw new Error(error.error || error.message || response.statusText);
	}

	imageHandler.clearCache(filename);

	if (images && filename in images) {
		delete images[filename];
	}
}

export interface SyncResult {
	success: boolean;
	message: string;
	count?: number;
}

export async function syncBackgrounds(): Promise<SyncResult> {
	const response = await fetch(`${apiUrl}/sync`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Sync failed: ${response.statusText}`);
	}

	const result: SyncResult = await response.json();

	if (!result.success) {
		throw new Error(result.message || 'Sync failed');
	}

	return result;
}
