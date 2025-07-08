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

	if (!config || typeof config !== 'object') {
		return false;
	}

	try {
		mutateFn(config);
	} catch (e) {
		console.error('Error mutating config:', e);
		return false;
	}

	try {
		const res = await fetch('/api/config', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(config)
		});

		if (!res.ok) {
			const contentType = res.headers.get('content-type');
			let msg = 'Unknown error';
			if (contentType?.includes('application/json')) {
				const data = await res.json();
				msg = data.message || JSON.stringify(data);
			} else {
				msg = await res.text();
			}
			console.error('Config PATCH failed:', msg);
			return false;
		}

		configStore.setConfig(config);
		return true;
	} catch (error) {
		console.error('Error saving config:', error);
		return false;
	}
}
