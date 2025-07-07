import { writable, get, type Writable } from 'svelte/store';

export type PIDMetadata = {
	desc: string;
	label: string;
	units: string[];
	min: number[];
	max: number[];
	decimals: number[];
};

type PIDsStore = {
	subscribe: Writable<PIDMetadata[]>['subscribe'];
	setPIDs: (pids: PIDMetadata[]) => void;
	getValue: () => PIDMetadata[];
	reset: () => void;
};

function createPIDStore(): PIDsStore {
	const { subscribe, set } = writable<PIDMetadata[]>([]);

	return {
		subscribe,
		setPIDs: (pids: PIDMetadata[]) => set(pids),
		getValue: () => get({ subscribe }),
		reset: () => set([])
	};
}

export const pidsStore: PIDsStore = createPIDStore();
