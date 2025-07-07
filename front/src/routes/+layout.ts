import { DigitalDashSchema } from '$schemas/digitaldash';
import { configStore } from '@/config/configStore';
import { getOptions } from '@/config/optionsCache';
import { pidsStore } from '@/config/PIDsStore';

export const load = async ({ fetch }) => {
	let config;

	try {
		const res = await fetch('/api/config');
		if (!res.ok) {
			console.error('Failed to fetch config:', res.status, res.statusText);
			config = null;
		} else {
			const raw = await res.json();
			const parsed = DigitalDashSchema.safeParse(raw);

			if (!parsed.success) {
				console.error('Failed to parse config:', parsed.error);
				config = null;
			} else {
				configStore.setConfig(parsed.data);
				config = parsed.data;
			}
		}
	} catch (err) {
		console.error('Config fetch error:', err);
		config = null;
	}

	// Load options
	let options = null;
	try {
		options = await getOptions(fetch);
	} catch (err) {
		console.warn('Failed to load options:', err);
	}

	let pids = [];
	try {
		const res = await fetch('/api/pids');
		if (!res.ok) {
			console.error('Failed to fetch PIDs:', res.status, res.statusText);
		} else {
			pids = await res.json();
			pidsStore.setPIDs(pids);
		}
	} catch (err) {
		console.error('PID fetch error:', err);
	}

	return { config, options, pids };
};
