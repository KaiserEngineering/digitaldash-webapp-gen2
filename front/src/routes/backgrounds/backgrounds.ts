// src/routes/backgrounds.ts
import { apiUrl } from '$lib/config'; // adjust as needed (or leave empty if same origin)

export async function uploadBackground(file: File): Promise<void> {
	const formData = new FormData();
	formData.append('file', file);
	// Optional: you can also include the filename explicitly:
	formData.append('filename', file.name);

	const response = await fetch(`${apiUrl}/api/backgrounds`, {
		method: 'POST',
		body: formData
	});
	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}
	console.log(await response.text());
}

export async function deleteBackground(filename: string): Promise<void> {
	const response = await fetch(`${apiUrl}/api/backgrounds?filename=${encodeURIComponent(filename)}`, {
		method: 'DELETE'
	});
	if (!response.ok) {
		throw new Error(`Delete failed: ${response.statusText}`);
	}
	console.log(await response.text());
}
