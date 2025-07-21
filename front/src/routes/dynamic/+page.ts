import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DynamicFormSchema } from './dynamicFormSchema';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { DigitalDashDynamic } from '$schemas/digitaldash';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const config = await parentData.config;
	const pids = await parentData.pids;
	const options = await parentData.options;

	const initialDynamic: DigitalDashDynamic[] = config?.dynamic || [];

	// Add index to dynamic rules if not present (for stable component keys)
	const dynamicWithIndex = initialDynamic.map((rule: DigitalDashDynamic, index: number) => ({
		...rule,
		index: rule.index ?? index
	}));

	type Priority = 'high' | 'medium' | 'low';

	let dynamicConfig: Record<Priority, DigitalDashDynamic> = {
		high: {} as DigitalDashDynamic,
		medium: {} as DigitalDashDynamic,
		low: {} as DigitalDashDynamic
	};

	for (const rule of dynamicWithIndex) {
		const key = rule.priority as Priority;
		if (key in dynamicConfig) {
			dynamicConfig[key] = rule;
		}
	}

	const form = await superValidate(dynamicConfig, zod4(DynamicFormSchema));

	return { form, pids, options, config };
};
