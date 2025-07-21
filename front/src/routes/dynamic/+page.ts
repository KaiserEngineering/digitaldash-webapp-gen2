import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { DigitalDashDynamic } from '$schemas/digitaldash';

export const load: PageLoad = async ({ parent }) => {
	const { config, pids, options } = await parent();

	const initialDynamic: DigitalDashDynamic[] = config?.dynamic || [];

	const dynamicWithIndex = initialDynamic.map((rule, i) => ({
		...rule,
		index: i
	}));

	type Priority = 'high' | 'medium' | 'low';

	const dynamicConfig: Record<Priority, DigitalDashDynamic> = {
		high: {} as DigitalDashDynamic,
		medium: {} as DigitalDashDynamic,
		low: {} as DigitalDashDynamic
	};

	for (const rule of dynamicWithIndex) {
		const key = rule.priority?.toLowerCase() as Priority;

		dynamicConfig[key] = rule;
	}

	const form = await superValidate(dynamicConfig, zod4(DynamicFormSchema));

	return { form, pids, options, config };
};
