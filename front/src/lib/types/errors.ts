/**
 * Custom error types for the DigitalDash application
 * Provides type-safe error handling with specific error categories
 */

export class DigitalDashError extends Error {
	constructor(message: string, public code: string, public statusCode?: number) {
		super(message);
		this.name = 'DigitalDashError';
	}
}

export class ConfigError extends DigitalDashError {
	constructor(message: string, public originalError?: Error) {
		super(message, 'CONFIG_ERROR');
		this.name = 'ConfigError';
	}
}

export class NetworkError extends DigitalDashError {
	constructor(message: string, public statusCode: number, public originalError?: Error) {
		super(message, 'NETWORK_ERROR', statusCode);
		this.name = 'NetworkError';
	}
}

export class ValidationError extends DigitalDashError {
	constructor(message: string, public field?: string, public originalError?: Error) {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class ImageError extends DigitalDashError {
	constructor(message: string, public filename?: string, public originalError?: Error) {
		super(message, 'IMAGE_ERROR');
		this.name = 'ImageError';
	}
}

export class DeviceError extends DigitalDashError {
	constructor(message: string, public originalError?: Error) {
		super(message, 'DEVICE_ERROR');
		this.name = 'DeviceError';
	}
}

/**
 * Type guard to check if error is a DigitalDashError
 */
export function isDigitalDashError(error: unknown): error is DigitalDashError {
	return error instanceof DigitalDashError;
}

/**
 * Type guard to check if error is a ConfigError
 */
export function isConfigError(error: unknown): error is ConfigError {
	return error instanceof ConfigError;
}

/**
 * Type guard to check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
	return error instanceof NetworkError;
}

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
	return error instanceof ValidationError;
}

/**
 * Type guard to check if error is an ImageError
 */
export function isImageError(error: unknown): error is ImageError {
	return error instanceof ImageError;
}

/**
 * Type guard to check if error is a DeviceError
 */
export function isDeviceError(error: unknown): error is DeviceError {
	return error instanceof DeviceError;
}

/**
 * Utility function to convert unknown errors to DigitalDashError
 */
export function toDigitalDashError(error: unknown): DigitalDashError {
	if (isDigitalDashError(error)) {
		return error;
	}
	
	if (error instanceof Error) {
		return new DigitalDashError(error.message, 'UNKNOWN_ERROR');
	}
	
	return new DigitalDashError(String(error), 'UNKNOWN_ERROR');
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = DigitalDashError> = 
	| { success: true; data: T }
	| { success: false; error: E };

/**
 * Utility function to create a successful result
 */
export function success<T>(data: T): Result<T, never> {
	return { success: true, data };
}

/**
 * Utility function to create a failed result
 */
export function failure<E extends DigitalDashError>(error: E): Result<never, E> {
	return { success: false, error };
}

/**
 * Utility function to wrap async operations in a Result type
 */
export async function tryAsync<T>(
	operation: () => Promise<T>
): Promise<Result<T>> {
	try {
		const data = await operation();
		return success(data);
	} catch (error) {
		return failure(toDigitalDashError(error));
	}
}

/**
 * Utility function to wrap sync operations in a Result type
 */
export function trySync<T>(
	operation: () => T
): Result<T> {
	try {
		const data = operation();
		return success(data);
	} catch (error) {
		return failure(toDigitalDashError(error));
	}
}