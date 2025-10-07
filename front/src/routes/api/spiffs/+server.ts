import { json, error } from '@sveltejs/kit';
import { isVercelDeployment } from '$lib/config';

export const prerender = false;

// API endpoint for SPIFFS file listing
// This will be replaced by the real C webserver implementation
export async function GET() {
	// Simulate processing time
	await new Promise((resolve) => setTimeout(resolve, 500));

	const { existsSync, statSync } = await import('fs');
	const { join } = await import('path');

	// Try to get real file information
	const firmwareFilePath = join(
		process.cwd(),
		'static',
		'spiffs',
		'digitaldash-firmware-gen2-stm32u5g.bin'
	);

	const bootloaderFilePath = join(
		process.cwd(),
		'static',
		'spiffs',
		'STM32U5G9ZJTXQ_OSPI_Bootloader.bin'
	);

	try {
		const files = [];

		// Check for firmware file
		if (existsSync(firmwareFilePath)) {
			const stats = statSync(firmwareFilePath);
			files.push({
				name: 'digitaldash-firmware-gen2-stm32u5g.bin',
				size: stats.size,
				type: 'Binary firmware file'
			});
		}

		// Check for bootloader file
		if (existsSync(bootloaderFilePath)) {
			const stats = statSync(bootloaderFilePath);
			files.push({
				name: 'STM32U5G9ZJTXQ_OSPI_Bootloader.bin',
				size: stats.size,
				type: 'Binary bootloader file'
			});
		}

		return json({
			success: true,
			files: files
		});
	} catch {
		// Fallback to mock data if file access fails
		return json({
			success: true,
			files: [
				{
					name: 'digitaldash-firmware-gen2-stm32u5g.bin',
					size: 524288,
					type: 'Binary firmware file'
				},
				{
					name: 'STM32U5G9ZJTXQ_OSPI_Bootloader.bin',
					size: 262144,
					type: 'Binary bootloader file'
				}
			]
		});
	}
}

// Dummy API endpoint for SPIFFS file upload
// This will be replaced by the real C webserver implementation
export async function POST({ request }) {
	const contentType = request.headers.get('content-type');
	let file: File | null = null;
	let filename = '';

	if (contentType?.includes('application/octet-stream')) {
		// Handle binary upload (like from STM flash page)
		const buffer = await request.arrayBuffer();
		file = new File([buffer], 'digitaldash-firmware-gen2-stm32u5g.bin', {
			type: 'application/octet-stream'
		});
		filename = 'digitaldash-firmware-gen2-stm32u5g.bin';
	} else {
		// Handle FormData upload
		const formData = await request.formData();
		file = formData.get('file') as File;
		filename = formData.get('filename') as string;
	}

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
