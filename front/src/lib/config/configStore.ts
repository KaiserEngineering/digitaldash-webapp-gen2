import { writable, get, type Writable } from 'svelte/store';
import type { DigitalDash } from '$schemas/digitaldash';

type ConfigStore = {
	subscribe: Writable<DigitalDash>['subscribe'];
	setConfig: (newConfig: DigitalDash) => void;
	updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => void;
	reset: () => void;
	getValue: () => DigitalDash;
};

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

export const configStore: ConfigStore = createConfigStore();
