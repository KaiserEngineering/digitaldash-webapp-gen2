import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { AlertsFormSchema } from './alertsFormSchema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const pids = await parentData.pids;
	const config = await parentData.config;
	const options = await parentData.options;

	const initialAlerts = config?.alert ?? [];

	// Add index to alerts if not present (for stable component keys)
	const alertsWithIndex = initialAlerts.map((alert, index) => ({
		...alert,
		index: alert.index ?? index
	}));

	const form = await superValidate({ items: alertsWithIndex }, zod4(AlertsFormSchema));

	return { form, pids, options };
};
