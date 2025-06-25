import { configStore } from '@/config/configStore';
import { get } from 'svelte/store';

export const load = async ({ fetch }) => {
	let config = get(configStore);

	if (!config || !config.view) {
		try {
			const res = await fetch('/api/config');

			if (!res.ok) {
				console.error('Failed to load config:', res.status, res.statusText);
			} else {
				const cfg = await res.json();
				configStore.setConfig(cfg);
				config = cfg;
			}
		} catch (err) {
			console.error('Error loading config:', err);
		}
	}

	return {
		config
	};
};
