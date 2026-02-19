// src/lib/utils/updateConfig.ts
import { configStore } from '$lib/stores/configStore';
import { get } from 'svelte/store';
import type { DigitalDash } from '$schemas/digitaldash';
import { UPLOAD_LIMITS } from './upload';
import { handleError, ValidationError } from './errorHandling';

/**
 * Updates the entire config object after applying custom modifications.
 * @param mutateFn A callback that receives and mutates the config before saving
 */
export async function updateConfig(
	mutateFn: (config: DigitalDash) => void
): Promise<{ success: boolean; config?: DigitalDash; error?: string }> {
	try {
		const currentConfig = get(configStore);
		if (!currentConfig) {
			throw new Error('No configuration available');
		}

		// Create a deep copy to avoid mutating the original
		const configCopy = structuredClone(currentConfig);

		// Apply the mutation
		mutateFn(configCopy);

		// Check payload size before sending (backend limit is 60KB)
		const payload = JSON.stringify(configCopy);
		if (payload.length > UPLOAD_LIMITS.CONFIG) {
			const error = new ValidationError(
				`Configuration too large: ${(payload.length / 1024).toFixed(1)}KB (max ${(UPLOAD_LIMITS.CONFIG / 1024).toFixed(0)}KB)`
			);
			handleError(error, { context: 'Save configuration' });
			return { success: false, error: error.message };
		}

		// Save the updated config
		const response = await fetch('/api/config', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: payload
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			const errorMsg = errorData.error || errorData.message || response.statusText;

			// Specific handling for 413 (payload too large)
			if (response.status === 413) {
				throw new ValidationError('Configuration is too large to save');
			}

			throw new Error(errorMsg);
		}

		// Update the store with the new config
		configStore.setConfig(configCopy);

		return { success: true, config: configCopy };
	} catch (error) {
		handleError(error, { context: 'Save configuration' });
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
