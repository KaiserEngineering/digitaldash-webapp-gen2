// src/lib/config/updateConfig.ts
import { configStore } from '@/config/configStore';
import { get } from 'svelte/store';
import { toast } from 'svelte-5-french-toast';

/**
 * Updates the entire config object after applying custom modifications.
 * @param mutateFn A callback that receives and mutates the config before saving
 * @param successMessage Toast message to show on success
 */
export async function updateFullConfig(
	mutateFn: (cfg: any) => void,
	successMessage = 'Configuration updated!'
): Promise<boolean> {
	let config = structuredClone(get(configStore)); // make safe mutable copy

	if (!config) {
		toast.error('Configuration not loaded. Please try again.');
		return false;
	}

	try {
		// Let caller mutate the config
		mutateFn(config);

		const res = await fetch('/api/config', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(config)
		});

		if (!res.ok) {
			const msg = await res.text();
			console.error('Config PATCH failed:', msg);
			toast.error('Failed to save configuration.');
			return false;
		}

		configStore.setConfig(config);
		toast.success(successMessage);
		return true;
	} catch (error) {
		console.error('Error saving config:', error);
		toast.error('Error saving configuration.');
		return false;
	}
}
