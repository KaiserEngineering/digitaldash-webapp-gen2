// src/routes/advanced/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DigitalDashSchema } from '$schemas/digitaldash';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const config = await parentData.config;

	const form = await superValidate(config, zod(DigitalDashSchema));

	return { form };
};
