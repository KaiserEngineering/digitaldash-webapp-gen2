export const prerender = false;
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { config } from '$lib/config.svelte';
import { DynamicSchema } from '$schemas/digitaldash';
import { zod } from 'sveltekit-superforms/adapters';
import type { z } from 'zod';

export const load: PageLoad = async () => {
	// Load full config from "$lib/config.svelte.ts" based on params.id
	const dynamicConfig = config.data.dynamic as unknown as z.infer<typeof DynamicSchema>;
	const formData = await superValidate(dynamicConfig, zod(DynamicSchema));

	return { formData };
};
