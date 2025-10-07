// src/routes/view/[id]/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { zod4 } from 'sveltekit-superforms/adapters';
import { redirect } from '@sveltejs/kit';
import { ViewSchema } from '$schemas/digitaldash';
import { getConfig } from '$lib/stores/configStore';
import { getOptions } from '$lib/stores/optionsCache';
import { getPids } from '$lib/stores/PIDsStore';

export const load: PageLoad = async ({ params }) => {
	const viewId = Number(params.id);

	const config = await getConfig();
	const options = await getOptions();
	const pids = await getPids();

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
		validatedForm = await superValidate(view, zod4(ViewSchema));
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
