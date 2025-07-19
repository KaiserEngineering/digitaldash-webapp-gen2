// src/lib/utils/updateConfig.ts
import { configStore } from '$lib/stores/configStore';
import { clearOptionsCache } from '$lib/stores/optionsCache';
import { get } from 'svelte/store';
import type { DigitalDash } from '$schemas/digitaldash';

/**
 * Updates the entire config object after applying custom modifications.
 * @param mutateFn A callback that receives and mutates the config before saving
 * @param successMessage Toast message to show on success
 * @param errorMessage Toast message to show on error
 */
export async function updateConfig(
	mutateFn: (config: DigitalDash) => void,
	successMessage = 'Configuration updated successfully',
	errorMessage = 'Failed to update configuration'
): Promise<boolean> {
	try {
		const currentConfig = get(configStore);
		if (!currentConfig) {
			throw new Error('No configuration available');
		}

		// Create a deep copy to avoid mutating the original
		const configCopy = structuredClone(currentConfig);
		
		// Apply the mutation
		mutateFn(configCopy);

		// Save the updated config
		const response = await fetch('/api/config', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(configCopy)
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to save configuration');
		}

		// Update the store with the new config
		configStore.setConfig(configCopy);
		
		// Clear options cache to ensure fresh data on next load
		clearOptionsCache();
		
		return true;
	} catch (error) {
		throw error;
	}
}