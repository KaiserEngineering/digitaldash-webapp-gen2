// src/routes/view/[id]/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { getOptions } from '@/config/optionsCache';
import { redirect } from '@sveltejs/kit';
import { ViewSchema } from '$schemas/digitaldash';
import { ImageHandler } from '$lib/image/handler';

export const load: PageLoad = async ({ params, fetch, parent }) => {
	const { config } = await parent();
	const viewId = Number(params.id);

	if (!config || !config.view) {
		throw redirect(302, '/');
	}

	const view = config.view[viewId];
	if (!view) {
		throw redirect(302, '/');
	}

	const options = await getOptions(fetch);
	const validatedForm = await superValidate(view, zod(ViewSchema));

	if (!validatedForm.valid) {
		console.error('Validation failed:', validatedForm.errors);
		throw redirect(302, '/');
	}

	const imageHandler = new ImageHandler();

	const customerImageNames = await imageHandler.getCustomerImageNames(fetch);
	const factoryImageNames = imageHandler.getFactoryBackgroundImages();

	const backgrounds = [...factoryImageNames, ...customerImageNames];

	return {
		form: validatedForm,
		viewId,
		themes: options.themes,
		pids: options.pids,
		backgrounds
	};
};
