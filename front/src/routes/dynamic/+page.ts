export const prerender = false;

import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { getOptions } from '@/config/optionsCache';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { config } = await parent();

	const dynamicConfig = {
		items: config.dynamic || []
	};

	const form = await superValidate(dynamicConfig, zod(DynamicFormSchema));

	const options = await getOptions(fetch);
	let pids = options.pids;

	return { form, pids };
};
