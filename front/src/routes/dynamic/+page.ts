import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const { config } = await parent();

	const dynamicConfig = {
		items: config?.dynamic || []
	};

	const form = await superValidate(dynamicConfig, zod(DynamicFormSchema));
	let pids: never[] = [];

	return { form, pids };
};
