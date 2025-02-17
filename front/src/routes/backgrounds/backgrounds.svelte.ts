// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config'; // adjust as needed (or leave empty if same origin)
import { toast } from 'svelte-5-french-toast';

export async function uploadBackground(
	files: File | File[],
	images: { [key: string]: File }
): Promise<Response> {
	const formData = new FormData();

	files = $state.snapshot(files);

	// If multiple files are provided, upload them all
	if (Array.isArray(files)) {
		for (const file of files) {
			formData.append('file', file);
			formData.append('filename', file.name);
		}
	}

	const response = await fetch(`${apiUrl}/backgrounds`, {
		method: 'POST',
		body: formData
	});
	if (!response.ok) {
		toast.error('Upload failed');
		throw new Error(`Upload failed: ${response.statusText}`);
	}
	toast.success('Upload successful');

	if (Array.isArray(files)) {
		for (const file of files) {
			images[file.name] = file;
		}
	} else {
		images[files.name] = files;
	}

	return response;
}

export async function deleteBackground(filename: string): Promise<void> {
	const response = await fetch(
		`${apiUrl}/api/backgrounds?filename=${encodeURIComponent(filename)}`,
		{
			method: 'DELETE'
		}
	);
	if (!response.ok) {
		throw new Error(`Delete failed: ${response.statusText}`);
	}
	console.log(await response.text());
}
