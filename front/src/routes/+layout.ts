import { DigitalDashSchema } from '$schemas/digitaldash';
import { configStore } from '@/config/configStore';
import { getOptions } from '@/config/optionsCache';
import { pidsStore } from '@/config/PIDsStore';

export const load = async ({ fetch }) => {
	const configPromise = fetch('/api/config')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('Config fetch failed'))))
		.then((raw) => {
			const parsed = DigitalDashSchema.safeParse(raw);
			if (!parsed.success) throw new Error('Invalid config schema');
			configStore.setConfig(parsed.data);
			return parsed.data;
		});

	const optionsPromise = getOptions(fetch).catch((error) => {
		console.error('Options fetch failed:', error);
		// Return empty options object as fallback
		return {};
	});

	const pidsPromise = fetch('/api/pids')
		.then((res) => (res.ok ? res.json() : Promise.reject(new Error('PID fetch failed'))))
		.then((pids) => {
			pidsStore.setPIDs(pids);
			return pids;
		});

	return {
		config: configPromise,
		options: optionsPromise,
		pids: pidsPromise
	};
};
