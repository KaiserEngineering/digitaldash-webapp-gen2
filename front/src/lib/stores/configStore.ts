import { writable, get, type Writable } from 'svelte/store';
import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';
import { fromZodError } from 'zod-validation-error';
import { browser } from '$app/environment';

const LOCAL_STORAGE_KEY = 'digitaldash_demo_config';

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
			// Always save to localStorage (demo mode)
			if (browser) {
				try {
					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
				} catch (error) {
					console.warn('Failed to save config to localStorage:', error);
				}
			}
		},

		updateField: <K extends keyof DigitalDash>(key: K, value: DigitalDash[K]) => {
			update((cfg) => {
				if (cfg) {
					const updated = { ...cfg, [key]: value };
					// Always save to localStorage (demo mode)
					if (browser) {
						try {
							localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
						} catch (error) {
							console.warn('Failed to save config to localStorage:', error);
						}
					}
					return updated;
				}
				return null;
			});
		},

		reset: () => {
			set(null);
			// Always clear localStorage (demo mode)
			if (browser) {
				try {
					localStorage.removeItem(LOCAL_STORAGE_KEY);
				} catch (error) {
					console.warn('Failed to clear config from localStorage:', error);
				}
			}
		},

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
			console.warn(
				'Config has validation errors, filtering invalid fields:',
				parsed.error.format()
			);

			// Convert Zod error to human-readable format
			const validationError = fromZodError(parsed.error, {
				prefix: 'Configuration validation failed',
				prefixSeparator: ': '
			});

			// Build a clean config by filtering out invalid items
			const cleanConfig: any = {
				view: Array.isArray(raw.view)
					? raw.view.filter((v: any, i: number) => {
							const errors = parsed.error.issues?.filter(
								(issue) => issue.path[0] === 'view' && issue.path[1] === i
							);
							if (errors && errors.length > 0) {
								console.warn(
									`Dropping invalid view[${i}]:`,
									errors.map((e) => e.message)
								);
								return false;
							}
							return true;
						})
					: [],
				alert: Array.isArray(raw.alert)
					? raw.alert.filter((a: any, i: number) => {
							const errors = parsed.error.issues?.filter(
								(issue) => issue.path[0] === 'alert' && issue.path[1] === i
							);
							if (errors && errors.length > 0) {
								console.warn(
									`Dropping invalid alert[${i}]:`,
									errors.map((e) => e.message)
								);
								return false;
							}
							return true;
						})
					: [],
				dynamic: Array.isArray(raw.dynamic)
					? raw.dynamic.filter((d: any, i: number) => {
							const errors = parsed.error.issues?.filter(
								(issue) => issue.path[0] === 'dynamic' && issue.path[1] === i
							);
							if (errors && errors.length > 0) {
								console.warn(
									`Dropping invalid dynamic[${i}]:`,
									errors.map((e) => e.message)
								);
								return false;
							}
							return true;
						})
					: [],
				general: Array.isArray(raw.general)
					? raw.general.filter((g: any, i: number) => {
							const errors = parsed.error.issues?.filter(
								(issue) => issue.path[0] === 'general' && issue.path[1] === i
							);
							if (errors && errors.length > 0) {
								console.warn(
									`Dropping invalid general[${i}]:`,
									errors.map((e) => e.message)
								);
								return false;
							}
							return true;
						})
					: []
			};

			// Store the human-readable error for UI to display
			configErrorStore.set(new Error(validationError.message));

			console.warn('Cleaned config:', cleanConfig);
			return cleanConfig as DigitalDash;
		}

		// Clear any previous errors
		configErrorStore.set(null);
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

	// Always check localStorage first (demo mode)
	if (browser) {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				const parsed = DigitalDashSchema.safeParse(JSON.parse(stored));
				if (parsed.success) {
					configStore.setConfig(parsed.data);
					return parsed.data;
				} else {
					console.warn('Stored config invalid, removing:', parsed.error);
					localStorage.removeItem(LOCAL_STORAGE_KEY);
				}
			}
		} catch (error) {
			console.warn('Failed to load config from localStorage:', error);
		}
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
