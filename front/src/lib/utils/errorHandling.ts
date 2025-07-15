import { toast } from 'svelte-5-french-toast';

export interface AppError {
	type: 'network' | 'validation' | 'server' | 'client' | 'unknown';
	message: string;
	details?: string;
	statusCode?: number;
	retryable?: boolean;
}

export class NetworkError extends Error implements AppError {
	type = 'network' as const;
	retryable = true;
	statusCode?: number;
	details?: string;

	constructor(message: string, statusCode?: number, details?: string) {
		super(message);
		this.name = 'NetworkError';
		this.statusCode = statusCode;
		this.details = details;
	}
}

export class ValidationError extends Error implements AppError {
	type = 'validation' as const;
	retryable = false;
	details?: string;

	constructor(message: string, details?: string) {
		super(message);
		this.name = 'ValidationError';
		this.details = details;
	}
}

export class ServerError extends Error implements AppError {
	type = 'server' as const;
	retryable = true;
	statusCode?: number;
	details?: string;

	constructor(message: string, statusCode?: number, details?: string) {
		super(message);
		this.name = 'ServerError';
		this.statusCode = statusCode;
		this.details = details;
	}
}

/**
 * Parse and classify errors from API responses
 */
export function parseApiError(error: unknown): AppError {
	if (error instanceof NetworkError || error instanceof ValidationError || error instanceof ServerError) {
		return error;
	}

	if (error instanceof Error) {
		// Check if it's a fetch error
		if (error.message.includes('fetch') || error.message.includes('network')) {
			return new NetworkError(
				'Unable to connect to DigitalDash device',
				undefined,
				error.message
			);
		}

		// Check if it's a validation error
		if (error.message.includes('schema') || error.message.includes('validation')) {
			return new ValidationError(
				'Invalid data received from device',
				error.message
			);
		}

		// Generic error
		return {
			type: 'unknown',
			message: error.message,
			details: error.stack,
			retryable: false
		};
	}

	// Handle Response objects
	if (typeof error === 'object' && error !== null && 'status' in error) {
		const response = error as Response;
		if (response.status >= 500) {
			return new ServerError(
				'Device server error',
				response.status,
				`HTTP ${response.status}: ${response.statusText}`
			);
		} else if (response.status >= 400) {
			return new ValidationError(
				'Invalid request to device',
				`HTTP ${response.status}: ${response.statusText}`
			);
		}
	}

	// Unknown error
	return {
		type: 'unknown',
		message: 'An unexpected error occurred',
		details: String(error),
		retryable: false
	};
}

/**
 * Handle errors with appropriate user feedback
 */
export function handleError(error: unknown, options: {
	showToast?: boolean;
	fallbackMessage?: string;
	context?: string;
} = {}) {
	const {
		showToast = true,
		fallbackMessage = 'Something went wrong',
		context = ''
	} = options;

	const appError = parseApiError(error);
	
	console.error(`Error ${context ? `in ${context}` : ''}:`, appError);

	if (showToast) {
		const message = appError.message || fallbackMessage;
		const toastMessage = context ? `${context}: ${message}` : message;
		
		switch (appError.type) {
			case 'network':
				toast.error(toastMessage, { 
					duration: 5000,
					icon: '🔌'
				});
				break;
			case 'validation':
				toast.error(toastMessage, {
					duration: 4000,
					icon: '⚠️'
				});
				break;
			case 'server':
				toast.error(toastMessage, {
					duration: 5000,
					icon: '🔧'
				});
				break;
			default:
				toast.error(toastMessage, {
					duration: 4000
				});
		}
	}

	return appError;
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: {
		maxRetries?: number;
		delay?: number;
		backoff?: boolean;
		onRetry?: (attempt: number, error: unknown) => void;
	} = {}
): Promise<T> {
	const {
		maxRetries = 3,
		delay = 1000,
		backoff = true,
		onRetry
	} = options;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			
			if (attempt === maxRetries) {
				break;
			}

			const appError = parseApiError(error);
			if (!appError.retryable) {
				break;
			}

			if (onRetry) {
				onRetry(attempt, error);
			}

			const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
			await new Promise(resolve => setTimeout(resolve, waitTime));
		}
	}

	throw lastError;
}