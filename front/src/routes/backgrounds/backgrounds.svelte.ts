// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config'; // adjust as needed (or leave empty if same origin)
import { ImageHandler } from '@/imageHandler.svelte';
import { toast } from 'svelte-5-french-toast';

interface UploadResponse {
	success: boolean;
	message?: string;
	filename?: string;
}

export async function uploadBackground(
	file: File,
	images: { [key: string]: any } = {}
): Promise<UploadResponse> {
	const response = await fetch(`${apiUrl}/background/${file.name}`, {
		method: 'POST',
		body: file,
		headers: {
			'Content-Type': file.type // e.g., "image/png"
		}
	});

	if (!response.ok) {
		toast.error('Upload failed');
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const result: UploadResponse = await response.json();

	if (result.filename) {
		// Update the images object with the server response and file metadata
		images[result.filename] = {
			filename: result.filename,
			url: `${apiUrl}/background/${result.filename}`,
			size: file.size,
			lastModified: file.lastModified,
			type: file.type
		};

		// Need to update our cache
		const imageHandler = new ImageHandler();
		imageHandler.clearImageCache(file.name);

		toast.success('Upload successful');
	} else {
		toast.error(result.message || 'Upload failed');
	}

	return result;
}

export async function deleteBackground(
	filename: string,
	images: { [key: string]: any } = {}
): Promise<void> {
	if (!filename) {
		toast.error('No filename provided');
		throw new Error('Filename is required');
	}

	try {
		const response = await fetch(`${apiUrl}/backgrounds?filename=${encodeURIComponent(filename)}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error(`Delete failed: ${response.statusText}`);
		}

		// Remove the image from the local state if images object is provided
		if (images && filename in images) {
			delete images[filename];
		}

		toast.success('Image deleted successfully');
	} catch (error) {
		toast.error('Failed to delete image');
		throw error;
	}
}
