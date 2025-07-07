// src/routes/view/[id]/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from '@sveltejs/kit';
import { ViewSchema } from '$schemas/digitaldash';

export const load: PageLoad = async ({ params, parent }) => {
	const { config, options, pids } = await parent();
	const viewId = Number(params.id);

	if (!config?.view) {
		console.error('No views found in config, redirecting to home.');
		throw redirect(302, '/');
	}

	const view = config.view[viewId];
	if (!view) {
		console.error(`View with ID ${viewId} not found, redirecting to home.`);
		throw redirect(302, '/');
	}

	let validatedForm;
	try {
		validatedForm = await superValidate(view, zod(ViewSchema));
	} catch (error) {
		console.error('Error validating form:', error);
		throw redirect(302, '/');
	}

	if (!validatedForm.valid) {
		console.error('Validation failed:', validatedForm.errors);
		throw redirect(302, '/');
	}

	return {
		form: validatedForm,
		viewId,
		themes: options?.gauge_theme || [],
		pids,
		backgrounds: options?.view_background || []
	};
};
