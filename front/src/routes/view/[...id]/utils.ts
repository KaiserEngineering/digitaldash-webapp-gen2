// src/lib/formHelpers.ts
import type { Writable } from 'svelte/store';
import type { SincegleViewEditType } from '$schemas/digitaldash';

// Add a new gauge.
export function addGauge(formStore: Writable<SincegleViewEditType>, autoSave: () => void) {
	formStore.update((form) => {
		const newGauge = {
			index: form.gauges.length,
			count: [3, 3],
			cmd: '',
			name: '',
			desc: '',
			type: '',
			dataType: '',
			default: 'THEME_STOCK_ST',
			options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
			limit: '',
			EEBytes: 0,
			theme: 'THEME_STOCK_ST',
			pid: ''
		};
		return { ...form, gauges: [...form.gauges, newGauge] };
	});
	autoSave();
}

// Remove a gauge at a given index.
export function removeGauge(
	formStore: Writable<SincegleViewEditType>,
	index: number,
	autoSave: () => void
) {
	formStore.update((form) => ({
		...form,
		gauges: form.gauges.filter((_, i) => i !== index)
	}));
	autoSave();
}

// Add a new alert.
export function addAlert(formStore: Writable<SincegleViewEditType>, autoSave: () => void) {
	formStore.update((form) => {
		const newAlert = {
			index: form.alerts.length,
			count: 5,
			cmd: '',
			name: '',
			desc: '',
			type: '',
			dataType: '',
			default: 'Disabled',
			options: ['Disabled', 'Enabled'],
			limit: '',
			EEBytes: 0,
			pid: '',
			message: '',
			compare: 'Equal'
		};
		return { ...form, alerts: [...form.alerts, newAlert] };
	});
	autoSave();
}

// Remove an alert at a given index.
export function removeAlert(
	formStore: Writable<SincegleViewEditType>,
	index: number,
	autoSave: () => void
) {
	formStore.update((form) => ({
		...form,
		alerts: form.alerts.filter((_, i) => i !== index)
	}));
	autoSave();
}

// Create a debounced autoSave function.
// (This function returns a debounced version of patchUpdate.)
export function createAutoSave(patchFn: () => void, delay = 1000): () => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return () => {
		if (timeout !== null) clearTimeout(timeout);
		timeout = setTimeout(() => {
			patchFn();
		}, delay);
	};
}
