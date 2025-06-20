import { configStore } from '@/config/configStore';
import { get } from 'svelte/store';
// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;

// We need this so that our output during build is one
// file.
export const ssr = false;

export const load = async ({ fetch }) => {
	let config = get(configStore);

	if (!config || !config.view) {
		const res = await fetch('/api/config');
		if (res.ok) {
			const cfg = await res.json();
			configStore.setConfig(cfg);
			config = cfg;
		} else {
			console.error('Failed to load config:', res.status, res.statusText);
		}
	}

	return {
		config
	};
};
