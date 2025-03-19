import type { ServerInit } from '@sveltejs/kit';
import { ConfigStore } from '$lib/config.svelte';
import { apiUrl } from '@/config';

export const init: ServerInit = async () => {
	const response = await fetch(`${apiUrl}/config`);
	const data = await response.json();

	// Update the global config state (validated and typed)
	ConfigStore.update(data);
};
