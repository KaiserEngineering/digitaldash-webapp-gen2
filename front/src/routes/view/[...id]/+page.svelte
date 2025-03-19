<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import {
		ViewSchema,
		GaugeArraySchema,
		AlertArraySchema,
		DynamicArraySchema
	} from '$schemas/digitaldash';
	import { zod } from 'sveltekit-superforms/adapters';

	// Import UI components
	import { Button } from '$lib/components/ui/button';
	import { CardContent, CardFooter } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import { AlertCircle } from 'lucide-svelte';

	// Get load data via $props() from our load function
	let { data }: PageProps = $props();

	const viewId = data.viewId;

	// Create superforms for each section using the wrapper schemas.
	const { form: viewForm, enhance: enhanceView } = superForm(data.viewForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(ViewSchema)
	});

	const { form: gaugesForm, enhance: enhanceGauges } = superForm(data.gaugesForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(GaugeArraySchema)
	});

	const { form: alertsForm, enhance: enhanceAlerts } = superForm(data.alertsForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(AlertArraySchema)
	});

	const { form: dynamicForm, enhance: enhanceDynamic } = superForm(data.dynamicForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(DynamicArraySchema)
	});

	console.log($gaugesForm);
</script>

<!-- Basic View Settings Form -->
<form method="POST" use:enhanceView>
	<CardContent class="space-y-8">
		<div class="space-y-6">
			<div class="flex items-center gap-2 text-lg font-semibold">
				<AlertCircle class="h-5 w-5" />
				<h3>Basic Settings</h3>
			</div>
			<Separator />

			<div class="grid gap-6 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<Input id="name" type="text" bind:value={viewForm.name} placeholder="Enter view name" />
				</div>

				<div class="space-y-2">
					<Label>Status</Label>
					<Select.Root bind:value={viewForm.enabled} type="single">
						<Select.Trigger>
							<span>{viewForm.enabled === 'true' ? 'Enabled' : 'Disabled'}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="true">Enabled</Select.Item>
							<Select.Item value="false">Disabled</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</div>
	</CardContent>
	<CardFooter>
		<Button type="submit">Save View</Button>
	</CardFooter>
</form>

<!-- Gauges Form -->
<form method="POST" use:enhanceGauges>
	<CardContent>
		<h3>Gauges</h3>
		{#each $gaugesForm.items as gauge, i}
			<div class="flex gap-2">
				<Input type="text" bind:value={gauge.pid} placeholder="PID" />
				<Input type="text" bind:value={gauge.name} placeholder="Name" />
				<Select.Root bind:value={gauge.theme} type="single">
					<Select.Trigger>
						<span>{gauge.theme}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="THEME_STOCK_ST">THEME_STOCK_ST</Select.Item>
						<Select.Item value="THEME_STOCK_RS">THEME_STOCK_RS</Select.Item>
					</Select.Content>
				</Select.Root>
				<Button variant="destructive">Remove</Button>
			</div>
		{/each}
		<Button>Add Gauge</Button>
	</CardContent>
</form>

<!-- Alerts Form -->
<form method="POST" use:enhanceAlerts>
	<CardContent>
		<h3>Alerts</h3>
		{#each $alertsForm.items as alert, i}
			<div class="flex gap-2">
				<Input type="text" bind:value={alert.pid} placeholder="PID" />
				<Select.Root bind:value={alert.compare} type="single">
					<Select.Trigger>
						<span>{alert.compare}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="EQUAL">EQUAL</Select.Item>
						<Select.Item value="LESS_THAN">LESS THAN</Select.Item>
						<Select.Item value="GREATER_THAN">GREATER THAN</Select.Item>
						<!-- Add other comparison options as needed -->
					</Select.Content>
				</Select.Root>
				<Input type="text" bind:value={alert.msg} placeholder="Alert message" />
				<Button variant="destructive">Remove</Button>
			</div>
		{/each}
		<Button>Add Alert</Button>
	</CardContent>
</form>

<!-- Dynamic Conditions Form -->
<form method="POST" use:enhanceDynamic>
	<CardContent>
		<h3>Dynamic Conditions</h3>
		{#each $dynamicForm.items as condition, i}
			<div class="flex gap-2">
				<Input type="text" bind:value={condition.pid} placeholder="PID" />
				<Select.Root bind:value={condition.compare} type="single">
					<Select.Trigger>
						<span>{condition.compare}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="EQUAL">EQUAL</Select.Item>
						<Select.Item value="LESS_THAN">LESS THAN</Select.Item>
						<Select.Item value="GREATER_THAN">GREATER THAN</Select.Item>
						<!-- Add other comparison options -->
					</Select.Content>
				</Select.Root>
				<Input type="number" bind:value={condition.thresh} placeholder="Threshold" />
				<Select.Root bind:value={condition.priority} type="single">
					<Select.Trigger>
						<span>{condition.priority}</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="Low">Low</Select.Item>
						<Select.Item value="Medium">Medium</Select.Item>
						<Select.Item value="High">High</Select.Item>
					</Select.Content>
				</Select.Root>
				<Button variant="destructive">Remove</Button>
			</div>
		{/each}
		<Button>Add Dynamic Condition</Button>
	</CardContent>
</form>
