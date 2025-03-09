import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { ViewSchema } from '$schemas/Digitaldash';
import { zod } from 'sveltekit-superforms/adapters';
import { config } from '$lib/config.svelte';

export const prerender = false;

export const load: PageLoad = async ({ params }: { params: { id: string } }) => {
	// Load full config from "$lib/config.svelte.ts" based on params.id
	const view = config.data.view[params.id as keyof typeof config.data.view];
	const formData = await superValidate(view, zod(ViewSchema));

	return { formData, viewId: params.id };
};
