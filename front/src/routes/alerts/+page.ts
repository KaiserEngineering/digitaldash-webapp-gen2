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

	// Convert array to object structure (numbered alerts)
	let alertsConfig: Record<string, any> = {};

	// Convert from array to object
	initialAlerts.forEach((alert: { index: any }, index: number) => {
		alertsConfig[index] = {
			...alert,
			index: index
		};
	});

	const form = await superValidate(alertsConfig, zod4(AlertsFormSchema));

	return { form, pids, options };
};
