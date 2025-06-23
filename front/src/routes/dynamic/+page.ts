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
	let options;
	try {
		options = await getOptions(fetch);
		if (!options) {
			throw new Error('Failed to load options');
		}
	} catch (error) {
		console.error('Error loading options:', error);
		return {
			form,
			pids: []
		};
	}
	let pids = options.pids;

	return { form, pids };
};
