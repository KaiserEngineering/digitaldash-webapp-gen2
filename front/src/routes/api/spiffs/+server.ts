import { json, error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export const prerender = false;

// API endpoint for SPIFFS file listing
// This will be replaced by the real C webserver implementation
export async function GET() {
	// Simulate processing time
	await new Promise((resolve) => setTimeout(resolve, 500));

	// For Vercel deployment, always return mock data
	if (isVercelDeployment) {
		return json({
			success: true,
			files: [
				{
					name: 'digitaldash-firmware-gen2-stm32u5g.bin',
					size: 524288,
					lastModified: new Date().toISOString(),
					type: 'Demo firmware file'
				}
			]
		});
	}

	// For local development, try to get real file information
	try {
		const { existsSync, statSync } = await import('fs');
		const { join } = await import('path');
		
		const filePath = join(
			process.cwd(),
			'static',
			'spiffs',
			'digitaldash-firmware-gen2-stm32u5g.bin'
		);

		if (existsSync(filePath)) {
			const stats = statSync(filePath);
			return json({
				success: true,
				files: [
					{
						name: 'digitaldash-firmware-gen2-stm32u5g.bin',
						size: stats.size,
						lastModified: stats.mtime.toISOString(),
						type: 'Binary firmware file'
					}
				]
			});
		} else {
			// File doesn't exist, return empty list
			return json({
				success: true,
				files: []
			});
		}
	} catch {
		// Fallback to mock data if file access fails
		return json({
			success: true,
			files: [
				{
					name: 'digitaldash-firmware-gen2-stm32u5g.bin',
					size: 524288,
					lastModified: new Date().toISOString(),
					type: 'Binary firmware file'
				}
			]
		});
	}
}

// Dummy API endpoint for SPIFFS file upload
// This will be replaced by the real C webserver implementation
export async function POST({ request }) {
	const formData = await request.formData();
	const file = formData.get('file') as File;
	const filename = formData.get('filename') as string;

	if (!file) {
		throw error(400, 'No file provided');
	}

	if (!filename) {
		throw error(400, 'No filename provided');
	}

	// Validate file is a .bin file
	if (!filename.endsWith('.bin')) {
		throw error(400, 'Only .bin files are allowed');
	}

	// Validate file size (max 2MB for firmware)
	const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
	if (file.size > MAX_FILE_SIZE) {
		throw error(413, 'File too large. Maximum size is 2MB');
	}

	// Simulate upload processing time
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Mock successful upload response (works in both local and Vercel)
	return json({
		success: true,
		message: isVercelDeployment 
			? 'Demo: File upload simulated successfully' 
			: 'File uploaded to SPIFFS successfully',
		filename: filename,
		size: file.size
	});
}

// Dummy API endpoint for SPIFFS file deletion
// This will be replaced by the real C webserver implementation
export async function DELETE({ url }) {
	const filename = url.searchParams.get('filename');

	if (!filename) {
		throw error(400, 'Filename parameter required');
	}

	// Simulate delete processing time
	await new Promise((resolve) => setTimeout(resolve, 300));

	// Mock successful delete response (works in both local and Vercel)
	return json({
		success: true,
		message: isVercelDeployment
			? `Demo: File ${filename} deletion simulated`
			: `File ${filename} deleted from SPIFFS successfully`
	});
}
