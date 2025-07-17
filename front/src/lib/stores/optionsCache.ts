// src/lib/config/optionsCache.ts
import { writable, get } from 'svelte/store';

export interface OptionsData {
	view_state?: string[];
	view_background?: string[];
	gauge_theme?: string[];
	alert_state?: string[];
	alert_comparison?: string[];
	dynamic_state?: string[];
	dynamic_priority?: string[];
	dynamic_comparison?: string[];
	[key: string]: string[] | undefined;
}

const optionsStore = writable<OptionsData | null>(null);
const loadingStore = writable<boolean>(false);
const errorStore = writable<Error | null>(null);

// Track if we're currently fetching to prevent duplicate requests
let fetchPromise: Promise<OptionsData> | null = null;

async function fetchOptions(fetch = globalThis.fetch): Promise<OptionsData> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

	try {
		const res = await fetch('/api/options', {
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!res.ok) {
			throw new Error(`Failed to fetch options: ${res.status} ${res.statusText}`);
		}
		return await res.json();
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

export async function loadOptions(fetch = globalThis.fetch): Promise<OptionsData> {
	// If already fetching, return the existing promise
	if (fetchPromise) {
		return fetchPromise;
	}

	loadingStore.set(true);
	errorStore.set(null);

	try {
		fetchPromise = fetchOptions(fetch);
		const options = await fetchPromise;
		optionsStore.set(options);
		return options;
	} catch (error) {
		const err = error instanceof Error ? error : new Error('Unknown error');
		errorStore.set(err);
		throw err;
	} finally {
		loadingStore.set(false);
		fetchPromise = null;
	}
}

export async function getOptions(fetch = globalThis.fetch): Promise<OptionsData> {
	// Check current value without creating a subscription
	const currentValue = get(optionsStore);

	if (currentValue) {
		return currentValue;
	}

	// If not cached, load and return
	return await loadOptions(fetch);
}

// Function to clear the cache (useful for invalidation)
export function clearOptionsCache(): void {
	optionsStore.set(null);
	errorStore.set(null);
	fetchPromise = null;
}

// Function to refresh options (force reload)
export async function refreshOptions(fetch = globalThis.fetch): Promise<OptionsData> {
	clearOptionsCache();
	return await loadOptions(fetch);
}

// Export stores for reactive usage in components
export { optionsStore, loadingStore, errorStore };

// Derived store that combines loading and error states
export const optionsState = {
	subscribe: (
		run: (value: { options: OptionsData | null; loading: boolean; error: Error | null }) => void
	) => {
		const unsubscribeOptions = optionsStore.subscribe((options) => {
			const loading = get(loadingStore);
			const error = get(errorStore);
			run({ options, loading, error });
		});

		const unsubscribeLoading = loadingStore.subscribe((loading) => {
			const options = get(optionsStore);
			const error = get(errorStore);
			run({ options, loading, error });
		});

		const unsubscribeError = errorStore.subscribe((error) => {
			const options = get(optionsStore);
			const loading = get(loadingStore);
			run({ options, loading, error });
		});

		return () => {
			unsubscribeOptions();
			unsubscribeLoading();
			unsubscribeError();
		};
	}
};
