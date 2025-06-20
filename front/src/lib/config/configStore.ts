import { writable, get } from 'svelte/store';
import type { DigitalDash } from '$schemas/digitaldash';

function createConfigStore() {
	const { subscribe, set, update } = writable<DigitalDash>();

	return {
		subscribe,

		setConfig: (newConfig: DigitalDash) => set(newConfig),

		updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => {
			update((cfg) => ({ ...cfg, [key]: value }));
		},

		reset: () => set(null as unknown as DigitalDash),

		getValue: () => get({ subscribe })
	};
}

export const configStore = createConfigStore();
