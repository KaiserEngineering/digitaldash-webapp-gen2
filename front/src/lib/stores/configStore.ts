import { writable, get, type Writable } from 'svelte/store';
import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';

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

		setConfig: (newConfig: DigitalDash) => {
			set(newConfig);
		},

		updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => {
			update((cfg) => {
				if (cfg) {
					const updated = { ...cfg, [key]: value };
					return updated;
				}
				return null;
			});
		},

		reset: () => set(null),

		getValue: () => get({ subscribe })
	};
}

export const configStore: ConfigStore = createConfigStore();

// Additional stores for loading and error states
const configLoadingStore = writable<boolean>(false);
const configErrorStore = writable<Error | null>(null);

// Track if we're currently fetching to prevent duplicate requests
let configFetchPromise: Promise<DigitalDash> | null = null;

async function fetchConfig(fetch = globalThis.fetch): Promise<DigitalDash> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

	try {
		const res = await fetch('/api/config', {
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!res.ok) {
			throw new Error(`Failed to fetch config: ${res.status} ${res.statusText}`);
		}

		const raw = await res.json();
		const parsed = DigitalDashSchema.safeParse(raw);

		if (!parsed.success) {
			console.error('Invalid config schema:', parsed.error);
			throw new Error('Invalid configuration schema');
		}

		return parsed.data;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

export async function loadConfig(fetch = globalThis.fetch): Promise<DigitalDash> {
	// If already fetching, return the existing promise
	if (configFetchPromise) {
		return configFetchPromise;
	}

	configLoadingStore.set(true);
	configErrorStore.set(null);

	try {
		configFetchPromise = fetchConfig(fetch);
		const config = await configFetchPromise;
		configStore.setConfig(config);
		return config;
	} catch (error) {
		const err = error instanceof Error ? error : new Error('Unknown error');
		configErrorStore.set(err);
		throw err;
	} finally {
		configLoadingStore.set(false);
		configFetchPromise = null;
	}
}

export async function getConfig(fetch = globalThis.fetch): Promise<DigitalDash> {
	// Check current value without creating a subscription
	const currentValue = configStore.getValue();

	if (currentValue) {
		return currentValue;
	}

	// If not cached, load and return
	return await loadConfig(fetch);
}

// Function to clear the cache (useful for invalidation)
export function clearConfigCache(): void {
	configStore.reset();
	configErrorStore.set(null);
	configFetchPromise = null;
}

// Function to refresh config (force reload)
export async function refreshConfig(fetch = globalThis.fetch): Promise<DigitalDash> {
	clearConfigCache();
	return await loadConfig(fetch);
}

// Export loading and error stores for reactive usage in components
export { configLoadingStore, configErrorStore };
