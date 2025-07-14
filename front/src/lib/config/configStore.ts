import { writable, get, type Writable } from 'svelte/store';
import type { DigitalDash } from '$schemas/digitaldash';

type ConfigStore = {
	subscribe: Writable<DigitalDash | null>['subscribe'];
	setConfig: (newConfig: DigitalDash) => void;
	updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => void;
	reset: () => void;
	getValue: () => DigitalDash | null;
};

function createConfigStore() {
	const { subscribe, set, update } = writable<DigitalDash | null>(null);

	return {
		subscribe,

		setConfig: (newConfig: DigitalDash) => set(newConfig),

		updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => {
			update((cfg) => (cfg ? { ...cfg, [key]: value } : null));
		},

		reset: () => set(null),

		getValue: () => get({ subscribe })
	};
}

export const configStore: ConfigStore = createConfigStore();
