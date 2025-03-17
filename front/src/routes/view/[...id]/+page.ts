// src/routes/view/[id]/+page.ts
import { superValidate } from 'sveltekit-superforms';
import type { PageLoad } from './$types';
import {
	GaugeSchema,
	AlertSchema,
	DynamicSchema,
	type GaugeType,
	type AlertType,
	type DynamicType,
	ViewSchema
} from '$schemas/digitaldash';
import { zod } from 'sveltekit-superforms/adapters';
import { ConfigStore } from '$lib/config.svelte';
import { z } from 'zod';

// Define wrapper schemas for arrays:
const GaugeArraySchema = z.object({
	items: z.array(GaugeSchema)
});
const AlertArraySchema = z.object({
	items: z.array(AlertSchema)
});
const DynamicArraySchema = z.object({
	items: z.array(DynamicSchema)
});

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
	const gauges = { items: configData.gauge.filter((g: GaugeType) => g.index === id) };
	const alerts = { items: configData.alert.filter((a: AlertType) => a.index === id) };
	const dynamic = { items: configData.dynamic.filter((d: DynamicType) => d.index === id) };

	const gaugesForm = await superValidate(gauges, zod(GaugeArraySchema));
	const alertsForm = await superValidate(alerts, zod(AlertArraySchema));
	const dynamicForm = await superValidate(dynamic, zod(DynamicArraySchema));
	const viewForm = await superValidate(view, zod(ViewSchema));

	return { viewForm, gaugesForm, alertsForm, dynamicForm, viewId: id };
};
