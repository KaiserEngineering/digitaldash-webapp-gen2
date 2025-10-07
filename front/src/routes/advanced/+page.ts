// src/routes/advanced/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { DigitalDashSchema } from '$schemas/digitaldash';
import { zod4 } from 'sveltekit-superforms/adapters';
import { getConfig } from '$lib/stores/configStore';

export const load: PageLoad = async () => {
	// Use cached data from stores - consistent with other pages
	const config = await getConfig();

	const form = await superValidate(config, zod4(DigitalDashSchema));

	return { form };
};
