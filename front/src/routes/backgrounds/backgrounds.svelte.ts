// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config'; // adjust as needed (or leave empty if same origin)
import { toast } from 'svelte-5-french-toast';

interface UploadResponse {
	success: boolean;
	message?: string;
	filename?: string;
}

export async function uploadBackground(
	files: File,
	images: { [key: string]: any } = {}
): Promise<UploadResponse> {
	const formData = new FormData();

	formData.append('file', files);
	formData.append('filename', files.name);

	const response = await fetch(`${apiUrl}/backgrounds`, {
		method: 'POST',
		body: formData
	});

	if (!response.ok) {
		toast.error('Upload failed');
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const result: UploadResponse = await response.json();

	if (result.filename) {
		// Get the corresponding file object
		const fileToUpload = Array.isArray(files)
			? files.find((f) => f.name === result.filename) || files[0]
			: files;

		// Update the images object with the server response and file metadata
		images[result.filename] = {
			filename: result.filename,
			url: `${apiUrl}/backgrounds/${result.filename}`,
			size: fileToUpload.size,
			lastModified: fileToUpload.lastModified,
			type: fileToUpload.type
		};

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
