// src/routes/view/[id]/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import { SingleViewEditSchema, type AlertType, type GaugeType } from '$schemas/digitaldash';
import { zod } from 'sveltekit-superforms/adapters';
import { ConfigStore } from '$lib/config.svelte';

export const prerender = false;

export const load: PageLoad = async ({ params }) => {
	// Get the global configuration data from the store.
	const configData = ConfigStore.config;
	if (!configData) {
		throw new Error('Configuration data not found');
	}

	const viewId = Number(params.id);
	const view = ConfigStore.getViewById(viewId);
	if (!view) {
		throw new Error(`View with ID ${params.id} not found`);
	}

	const id: number = Number(params.id);

	// Get related data using our helper methods.
	const gauges = configData.gauge.filter((g: GaugeType) => g.index === id);
	const alerts = configData.alert.filter((a: AlertType) => a.index === id);

	const viewForm = {
		view,
		gauges,
		alerts
	};

	const form = await superValidate(viewForm, zod(SingleViewEditSchema));

	return { form, viewId: id };
};
