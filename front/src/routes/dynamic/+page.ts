import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const config = await parentData.config;
	const pids = await parentData.pids;
	const options = await parentData.options;

	const initialDynamic = config?.dynamic || [];

	// Add index to dynamic rules if not present (for stable component keys)
	const dynamicWithIndex = initialDynamic.map((rule, index) => ({
		...rule,
		index: rule.index ?? index
	}));

	const dynamicConfig = {
		items: dynamicWithIndex
	};

	const form = await superValidate(dynamicConfig, zod4(DynamicFormSchema));

	return { form, pids, options, config };
};
