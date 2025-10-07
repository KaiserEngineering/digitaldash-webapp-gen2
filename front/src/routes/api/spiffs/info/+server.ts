import { json } from '@sveltejs/kit';

export const prerender = false;

// API endpoint for SPIFFS usage info
// This will be replaced by the real C webserver implementation at /api/spiffs/info
export async function GET() {
	// Simulate processing time
	await new Promise((resolve) => setTimeout(resolve, 200));

	// Mock SPIFFS usage data (typical ESP32-S3 SPIFFS partition size)
	const mockData = {
		success: true,
		total: 1048576, // 1MB total
		used: 524288, // 512KB used
		free: 524288, // 512KB free
		usage_percent: 50.0
	};

	return json(mockData);
}
