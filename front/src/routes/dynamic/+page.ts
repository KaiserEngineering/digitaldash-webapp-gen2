import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const config = await parentData.config;
	const pids = await parentData.pids;
	const options = await parentData.options;

	const dynamicConfig = {
		items: config?.dynamic || []
	};

	const form = await superValidate(dynamicConfig, zod(DynamicFormSchema));

	return { form, pids, options, config };
};
