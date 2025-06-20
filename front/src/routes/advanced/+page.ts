// src/routes/advanced/+page.ts
export const prerender = false;

import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DigitalDashSchema } from '$schemas/digitaldash';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageLoad = async ({ parent }) => {
	const { config } = await parent();

	const form = await superValidate(config, zod(DigitalDashSchema));

	return { form };
};
