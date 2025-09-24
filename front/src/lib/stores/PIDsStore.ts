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
		setPIDs: (pids: PIDMetadata[]) => {
			set(pids);
		},
		getValue: () => get({ subscribe }),
		reset: () => set([])
	};
}

export const pidsStore: PIDsStore = createPIDStore();

// Additional stores for loading and error states
const pidsLoadingStore = writable<boolean>(false);
const pidsErrorStore = writable<Error | null>(null);

// Track if we're currently fetching to prevent duplicate requests
let pidsFetchPromise: Promise<PIDMetadata[]> | null = null;

async function fetchPids(fetch = globalThis.fetch): Promise<PIDMetadata[]> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

	try {
		const res = await fetch('/api/pids', {
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!res.ok) {
			throw new Error(`Failed to fetch PIDs: ${res.status} ${res.statusText}`);
		}

		return await res.json();
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

export async function loadPids(fetch = globalThis.fetch): Promise<PIDMetadata[]> {
	// If already fetching, return the existing promise
	if (pidsFetchPromise) {
		return pidsFetchPromise;
	}

	pidsLoadingStore.set(true);
	pidsErrorStore.set(null);

	try {
		pidsFetchPromise = fetchPids(fetch);
		const pids = await pidsFetchPromise;
		pidsStore.setPIDs(pids);
		return pids;
	} catch (error) {
		const err = error instanceof Error ? error : new Error('Unknown error');
		pidsErrorStore.set(err);
		throw err;
	} finally {
		pidsLoadingStore.set(false);
		pidsFetchPromise = null;
	}
}

export async function getPids(fetch = globalThis.fetch): Promise<PIDMetadata[]> {
	// Check current value without creating a subscription
	const currentValue = pidsStore.getValue();

	if (currentValue && currentValue.length > 0) {
		return currentValue;
	}

	// If not cached, load and return
	return await loadPids(fetch);
}

// Function to clear the cache (useful for invalidation)
export function clearPidsCache(): void {
	pidsStore.reset();
	pidsErrorStore.set(null);
	pidsFetchPromise = null;
}

// Function to refresh PIDs (force reload)
export async function refreshPids(fetch = globalThis.fetch): Promise<PIDMetadata[]> {
	clearPidsCache();
	return await loadPids(fetch);
}

// Export loading and error stores for reactive usage in components
export { pidsLoadingStore, pidsErrorStore };
