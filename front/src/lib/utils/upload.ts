// src/lib/utils/upload.ts
import { handleError, ServerError, ValidationError, NetworkError } from './errorHandling';

// CRC32 lookup table (standard polynomial 0xEDB88320)
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) {
		crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
	}
	CRC32_TABLE[i] = crc >>> 0;
}

/**
 * Calculate CRC32 checksum of a Blob/File
 * Uses standard polynomial matching ESP-IDF's esp_rom_crc32_le
 */
export async function calculateCRC32(blob: Blob): Promise<number> {
	const buffer = await blob.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) {
		crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

// Match backend limits
export const UPLOAD_LIMITS = {
	CONFIG: 16 * 1024, // 16KB - matches JSON_BUF_SIZE (typical config ~4KB)
	IMAGE: 1 * 1024 * 1024, // 1MB - matches MAX_FILE_SIZE in images_handler
	SPIFFS: 4 * 1024 * 1024, // 4MB - matches MAX_FILE_SIZE in file_handler
	FIRMWARE: 10 * 1024 * 1024 // 10MB - practical limit for OTA
} as const;

export interface UploadOptions {
	/** Maximum file size in bytes */
	maxSize?: number;
	/** Request timeout in ms (default: 60000) */
	timeout?: number;
	/** Progress callback (0-100) */
	onProgress?: (percent: number) => void;
	/** Context for error messages */
	context?: string;
	/** Number of retry attempts for network errors (default: 3) */
	retries?: number;
	/** Base delay between retries in ms (default: 1000) */
	retryDelay?: number;
	/** Enable CRC32 checksum verification (default: true) */
	verifyChecksum?: boolean;
}

export interface UploadResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Parse error response from backend
 * Backend returns: {"error": "message"} or {"message": "...", "success": false}
 */
async function parseErrorResponse(response: Response): Promise<string> {
	try {
		const json = await response.json();
		return json.error || json.message || response.statusText;
	} catch {
		return response.statusText;
	}
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable (network issues, timeouts, server errors)
 */
function isRetryableError(status: number): boolean {
	return status === 408 || status === 500 || status === 502 || status === 503 || status === 504;
}

/**
 * Map HTTP status codes to appropriate error types
 */
function createErrorFromStatus(status: number, message: string): Error {
	switch (status) {
		case 408:
			return new NetworkError('Upload timed out - please try again', status, message);
		case 413:
			return new ValidationError('File is too large', message);
		case 422:
			return new ValidationError('File corrupted during transfer - please try again', message);
		case 400:
			return new ValidationError(message);
		case 500:
		case 502:
		case 503:
			return new ServerError(message, status);
		default:
			return new Error(message);
	}
}

/**
 * Validate file before upload
 */
export function validateFile(
	file: File,
	options: { maxSize?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
	const { maxSize, allowedTypes } = options;

	if (maxSize && file.size > maxSize) {
		const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
		const fileMB = (file.size / (1024 * 1024)).toFixed(1);
		return {
			valid: false,
			error: `File too large: ${fileMB}MB (max ${maxMB}MB)`
		};
	}

	if (allowedTypes && allowedTypes.length > 0) {
		const isAllowed = allowedTypes.some(
			(type) => file.type === type || file.name.endsWith(type.replace('*', ''))
		);
		if (!isAllowed) {
			return {
				valid: false,
				error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
			};
		}
	}

	return { valid: true };
}

/**
 * Single upload attempt with progress tracking using XHR
 */
function attemptUploadWithProgress<T>(
	url: string,
	file: File | Blob,
	timeout: number,
	onProgress?: (percent: number) => void,
	checksum?: number
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.timeout = timeout;

		if (file instanceof File) {
			xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
		}

		if (checksum !== undefined) {
			xhr.setRequestHeader('X-Checksum-CRC32', checksum.toString(16).toUpperCase().padStart(8, '0'));
		}

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable && onProgress) {
				onProgress(Math.round((e.loaded / e.total) * 100));
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					const data = JSON.parse(xhr.responseText) as T;
					resolve({ success: true, data });
				} catch {
					resolve({ success: true });
				}
			} else {
				let errorMsg: string;
				try {
					const json = JSON.parse(xhr.responseText);
					errorMsg = json.error || json.message || xhr.statusText;
				} catch {
					errorMsg = xhr.statusText;
				}
				resolve({ success: false, error: errorMsg, status: xhr.status });
			}
		};

		xhr.onerror = () => {
			resolve({ success: false, error: 'Network error', status: 0 });
		};

		xhr.ontimeout = () => {
			resolve({ success: false, error: 'Upload timed out', status: 408 });
		};

		xhr.send(file);
	});
}

/**
 * Upload file with progress tracking using XHR
 * Use this when you need progress updates
 * Supports automatic retry with exponential backoff for network errors
 */
export async function uploadWithProgress<T = unknown>(
	url: string,
	file: File | Blob,
	options: UploadOptions = {}
): Promise<UploadResult<T>> {
	const {
		maxSize,
		timeout = 60000,
		onProgress,
		context = 'Upload',
		retries = 3,
		retryDelay = 1000,
		verifyChecksum = true
	} = options;

	// Client-side size validation
	if (maxSize && file.size > maxSize) {
		const error = `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max ${(maxSize / (1024 * 1024)).toFixed(1)}MB)`;
		handleError(new ValidationError(error), { context });
		return { success: false, error };
	}

	// Calculate checksum before upload
	let checksum: number | undefined;
	if (verifyChecksum) {
		checksum = await calculateCRC32(file);
	}

	let lastError = '';
	let lastStatus = 0;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			// Exponential backoff: 1s, 2s, 4s...
			const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
			console.log(`${context}: Retry attempt ${attempt}/${retries} after ${backoffDelay}ms`);
			await delay(backoffDelay);
			// Reset progress for retry
			onProgress?.(0);
		}

		const result = await attemptUploadWithProgress<T>(url, file, timeout, onProgress, checksum);

		if (result.success) {
			return { success: true, data: result.data };
		}

		lastError = result.error || 'Upload failed';
		lastStatus = result.status || 0;

		// Don't retry validation errors (400, 413) or checksum errors (422) - they won't succeed on retry
		if (lastStatus === 400 || lastStatus === 413 || lastStatus === 422) {
			break;
		}

		// Only retry on network errors or server errors
		if (!isRetryableError(lastStatus) && lastStatus !== 0) {
			break;
		}
	}

	const error = createErrorFromStatus(lastStatus, lastError);
	handleError(error, { context });
	return { success: false, error: lastError };
}

/**
 * Single upload attempt using fetch
 */
async function attemptUpload<T>(
	url: string,
	file: File | Blob,
	timeout: number,
	checksum?: number
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	const headers: Record<string, string> = {
		'Content-Type': file instanceof File ? file.type : 'application/octet-stream'
	};

	if (checksum !== undefined) {
		headers['X-Checksum-CRC32'] = checksum.toString(16).toUpperCase().padStart(8, '0');
	}

	try {
		const response = await fetch(url, {
			method: 'POST',
			body: file,
			headers,
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorMsg = await parseErrorResponse(response);
			return { success: false, error: errorMsg, status: response.status };
		}

		try {
			const data = (await response.json()) as T;
			return { success: true, data };
		} catch {
			return { success: true };
		}
	} catch (err) {
		clearTimeout(timeoutId);

		if (err instanceof Error && err.name === 'AbortError') {
			return { success: false, error: 'Upload timed out', status: 408 };
		}

		return { success: false, error: err instanceof Error ? err.message : 'Upload failed', status: 0 };
	}
}

/**
 * Simple upload using fetch (no progress)
 * Use this for small files where progress isn't needed
 * Supports automatic retry with exponential backoff for network errors
 */
export async function upload<T = unknown>(
	url: string,
	file: File | Blob,
	options: UploadOptions = {}
): Promise<UploadResult<T>> {
	const {
		maxSize,
		timeout = 60000,
		context = 'Upload',
		retries = 3,
		retryDelay = 1000,
		verifyChecksum = true
	} = options;

	// Client-side size validation
	if (maxSize && file.size > maxSize) {
		const error = `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max ${(maxSize / (1024 * 1024)).toFixed(1)}MB)`;
		handleError(new ValidationError(error), { context });
		return { success: false, error };
	}

	// Calculate checksum before upload
	let checksum: number | undefined;
	if (verifyChecksum) {
		checksum = await calculateCRC32(file);
	}

	let lastError = '';
	let lastStatus = 0;

	for (let attempt = 0; attempt <= retries; attempt++) {
		if (attempt > 0) {
			// Exponential backoff: 1s, 2s, 4s...
			const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
			console.log(`${context}: Retry attempt ${attempt}/${retries} after ${backoffDelay}ms`);
			await delay(backoffDelay);
		}

		const result = await attemptUpload<T>(url, file, timeout, checksum);

		if (result.success) {
			return { success: true, data: result.data };
		}

		lastError = result.error || 'Upload failed';
		lastStatus = result.status || 0;

		// Don't retry validation errors (400, 413) or checksum errors (422) - they won't succeed on retry
		if (lastStatus === 400 || lastStatus === 413 || lastStatus === 422) {
			break;
		}

		// Only retry on network errors or server errors
		if (!isRetryableError(lastStatus) && lastStatus !== 0) {
			break;
		}
	}

	const error = createErrorFromStatus(lastStatus, lastError);
	handleError(error, { context });
	return { success: false, error: lastError };
}
