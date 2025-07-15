import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { DigitalDash } from '$schemas/digitaldash';
import type { PIDMetadata } from '$lib/stores/PIDsStore';

export interface OfflineData {
	config: DigitalDash | null;
	options: Record<string, any> | null;
	pids: PIDMetadata[] | null;
	lastUpdated: number;
}

const STORAGE_KEY = 'digitaldash-offline-data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function createOfflineStore() {
	const { subscribe, set, update } = writable<OfflineData>({
		config: null,
		options: null,
		pids: null,
		lastUpdated: 0
	});

	// Load from localStorage on initialization
	if (browser) {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const data = JSON.parse(stored) as OfflineData;
				set(data);
			}
		} catch (e) {
			console.warn('Failed to load offline data from localStorage:', e);
		}
	}

	return {
		subscribe,
		
		saveConfig: (config: DigitalDash) => {
			if (!browser) return;
			
			update(data => {
				const newData = { ...data, config, lastUpdated: Date.now() };
				localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
				return newData;
			});
		},

		saveOptions: (options: Record<string, any>) => {
			if (!browser) return;
			
			update(data => {
				const newData = { ...data, options, lastUpdated: Date.now() };
				localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
				return newData;
			});
		},

		savePids: (pids: PIDMetadata[]) => {
			if (!browser) return;
			
			update(data => {
				const newData = { ...data, pids, lastUpdated: Date.now() };
				localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
				return newData;
			});
		},

		clear: () => {
			if (!browser) return;
			
			localStorage.removeItem(STORAGE_KEY);
			set({
				config: null,
				options: null,
				pids: null,
				lastUpdated: 0
			});
		}
	};
}

export const offlineStore = createOfflineStore();

// Online/offline status
export const isOnline = writable(browser ? navigator.onLine : true);
export const isDeviceConnected = writable(false);

if (browser) {
	window.addEventListener('online', () => isOnline.set(true));
	window.addEventListener('offline', () => isOnline.set(false));
	
	// Check DigitalDash device connectivity
	async function checkDeviceConnectivity() {
		try {
			const response = await fetch('/api/firmware-version', { 
				method: 'GET',
				cache: 'no-store',
				signal: AbortSignal.timeout(3000) // 3 second timeout
			});
			isDeviceConnected.set(response.ok);
		} catch {
			isDeviceConnected.set(false);
		}
	}
	
	// Check device connectivity on load and periodically
	checkDeviceConnectivity();
	setInterval(checkDeviceConnectivity, 10000); // Check every 10 seconds
}

// Derived store that indicates if cached data is still valid
export const hasValidCache = derived(
	offlineStore,
	($offlineStore) => {
		if (!$offlineStore.lastUpdated) return false;
		const age = Date.now() - $offlineStore.lastUpdated;
		return age < CACHE_DURATION;
	}
);

