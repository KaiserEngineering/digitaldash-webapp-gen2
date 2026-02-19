// src/lib/utils/upload.ts
import { handleError, ServerError, ValidationError, NetworkError } from './errorHandling';

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
 * Map HTTP status codes to appropriate error types
 */
function createErrorFromStatus(status: number, message: string): Error {
	switch (status) {
		case 408:
			return new NetworkError('Upload timed out - please try again', status, message);
		case 413:
			return new ValidationError('File is too large', message);
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
 * Upload file with progress tracking using XHR
 * Use this when you need progress updates
 */
export function uploadWithProgress<T = unknown>(
	url: string,
	file: File | Blob,
	options: UploadOptions = {}
): Promise<UploadResult<T>> {
	const { maxSize, timeout = 60000, onProgress, context = 'Upload' } = options;

	return new Promise((resolve) => {
		// Client-side size validation
		if (maxSize && file.size > maxSize) {
			const error = `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max ${(maxSize / (1024 * 1024)).toFixed(1)}MB)`;
			handleError(new ValidationError(error), { context });
			resolve({ success: false, error });
			return;
		}

		const xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.timeout = timeout;

		if (file instanceof File) {
			xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
		}

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable && onProgress) {
				onProgress(Math.round((e.loaded / e.total) * 100));
			}
		};

		xhr.onload = async () => {
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

				const error = createErrorFromStatus(xhr.status, errorMsg);
				handleError(error, { context });
				resolve({ success: false, error: errorMsg });
			}
		};

		xhr.onerror = () => {
			const error = new NetworkError('Network error during upload');
			handleError(error, { context });
			resolve({ success: false, error: 'Network error' });
		};

		xhr.ontimeout = () => {
			const error = new NetworkError('Upload timed out', 408);
			handleError(error, { context });
			resolve({ success: false, error: 'Upload timed out' });
		};

		xhr.send(file);
	});
}

/**
 * Simple upload using fetch (no progress)
 * Use this for small files where progress isn't needed
 */
export async function upload<T = unknown>(
	url: string,
	file: File | Blob,
	options: UploadOptions = {}
): Promise<UploadResult<T>> {
	const { maxSize, timeout = 60000, context = 'Upload' } = options;

	// Client-side size validation
	if (maxSize && file.size > maxSize) {
		const error = `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max ${(maxSize / (1024 * 1024)).toFixed(1)}MB)`;
		handleError(new ValidationError(error), { context });
		return { success: false, error };
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			method: 'POST',
			body: file,
			headers: {
				'Content-Type': file instanceof File ? file.type : 'application/octet-stream'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorMsg = await parseErrorResponse(response);
			const error = createErrorFromStatus(response.status, errorMsg);
			handleError(error, { context });
			return { success: false, error: errorMsg };
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
			const error = new NetworkError('Upload timed out', 408);
			handleError(error, { context });
			return { success: false, error: 'Upload timed out' };
		}

		handleError(err, { context });
		return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
	}
}
