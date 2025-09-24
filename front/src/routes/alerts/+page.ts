import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { AlertsFormSchema } from './alertsFormSchema';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { DigitalDashAlert } from '$schemas/digitaldash';
import { getConfig } from '$lib/stores/configStore';
import { getOptions } from '$lib/stores/optionsCache';
import { getPids } from '$lib/stores/PIDsStore';

function normalizeText(s: unknown): string | unknown {
	if (typeof s !== 'string') return s;
	// Map smart quotes (UTF-8) and common CP-1252 fallbacks to ASCII
	return s
		.replace(/\u2018|\u0091/g, "'") // ‘ or CP-1252 left single
		.replace(/\u2019|\u0092/g, "'") // ’ or CP-1252 right single
		.replace(/\u201C|\u0093/g, '"') // “ or CP-1252 left double
		.replace(/\u201D|\u0094/g, '"') // ” or CP-1252 right double
		.normalize('NFC');
}

function normalizeAlert(a: DigitalDashAlert): DigitalDashAlert {
	return {
		...a,
		message: normalizeText(a.message) as string
	};
}

export const load: PageLoad = async () => {
	// Use cached data from stores - consistent with other pages
	const config = await getConfig();
	const options = await getOptions();
	const pids = await getPids();

	// Normalize incoming alerts (handles curly quotes & mis-encodings)
	const initialAlerts: DigitalDashAlert[] = (config?.alert ?? []).map(normalizeAlert);

	// Convert array to object structure (numbered alerts)
	const alertsConfig: Record<string, DigitalDashAlert & { index: number }> = {};
	initialAlerts.forEach((alert, index) => {
		alertsConfig[index] = { ...alert, index };
	});

	const form = await superValidate(alertsConfig, zod4(AlertsFormSchema));
	return { form, pids, options };
};
