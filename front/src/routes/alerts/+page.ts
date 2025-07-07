import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { AlertsFormSchema } from './alertsFormSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const { config, pids } = await parent();

	const initialAlerts = config?.alert ?? [];

	const form = await superValidate({ items: initialAlerts }, zod(AlertsFormSchema));

	return { form, pids };
};
