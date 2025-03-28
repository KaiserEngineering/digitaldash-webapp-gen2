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
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { AlertCircle, Gauge, Bell, Activity, Save, Plus, Trash2 } from 'lucide-svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { toast } from 'svelte-5-french-toast';

	// Get load data via $props() from our load function
	let { data }: PageProps = $props();

	// Create superforms for each section using the wrapper schemas.
	const {
		form: viewForm,
		enhance: enhanceView,
		submitting: viewSubmitting
	} = superForm(data.viewForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(ViewSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Your view configuration has been updated');
			}
		}
	});

	const {
		form: gaugesForm,
		enhance: enhanceGauges,
		submitting: gaugesSubmitting
	} = superForm(data.gaugesForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(GaugeArraySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Your gauge configuration has been updated');
			}
		}
	});
	console.log('Gauges Form:', $gaugesForm);

	const {
		form: alertsForm,
		enhance: enhanceAlerts,
		submitting: alertsSubmitting
	} = superForm(data.alertsForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(AlertArraySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Your alert configuration has been updated');
			}
		}
	});

	const {
		form: dynamicForm,
		enhance: enhanceDynamic,
		submitting: dynamicSubmitting
	} = superForm(data.dynamicForm, {
		dataType: 'json',
		SPA: true,
		validators: zod(DynamicArraySchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Your dynamic conditions have been updated');
			}
		}
	});

	// Functions to add new items
	function addGauge() {
		$gaugesForm.items = [
			...$gaugesForm.items,
			{
				index: $gaugesForm.items.length,
				count: [3, 3],
				cmd: '',
				name: '',
				desc: '',
				type: '',
				dataType: '',
				default: 'THEME_STOCK_ST',
				options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
				limit: '',
				EEBytes: 0,
				theme: 'THEME_STOCK_ST',
				pid: ''
			}
		];
		// Auto-save when adding a new item
		setTimeout(() => document.getElementById('gauges-form')?.requestSubmit(), 100);
	}

	function addAlert() {
		$alertsForm.items = [
			...$alertsForm.items,
			{
				index: $alertsForm.items.length,
				count: 5,
				cmd: '',
				name: '',
				desc: '',
				type: '',
				dataType: '',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: '',
				EEBytes: 0,
				pid: '',
				message: '',
				compare: 'Equal'
			}
		];
		// Auto-save when adding a new item
		setTimeout(() => document.getElementById('alerts-form')?.requestSubmit(), 100);
	}

	function addDynamicCondition() {
		$dynamicForm.items = [
			...$dynamicForm.items,
			{
				index: $dynamicForm.items.length,
				count: 2,
				cmd: '',
				name: '',
				desc: '',
				type: '',
				dataType: '',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: '',
				EEBytes: 0,
				enabled: true,
				pid: '',
				compare: 'EQUAL',
				thresh: 0,
				priority: 'Medium'
			}
		];
		// Auto-save when adding a new item
		setTimeout(() => document.getElementById('dynamic-form')?.requestSubmit(), 100);
	}

	// Functions to remove items
	function removeGauge(index: number) {
		$gaugesForm.items = $gaugesForm.items.filter((_, i) => i !== index);
		// Auto-save when removing an item
		setTimeout(() => document.getElementById('gauges-form')?.requestSubmit(), 100);
	}

	function removeAlert(index: number) {
		$alertsForm.items = $alertsForm.items.filter((_, i) => i !== index);
		// Auto-save when removing an item
		setTimeout(() => document.getElementById('alerts-form')?.requestSubmit(), 100);
	}

	function removeDynamicCondition(index: number) {
		$dynamicForm.items = $dynamicForm.items.filter((_, i) => i !== index);
		// Auto-save when removing an item
		setTimeout(() => document.getElementById('dynamic-form')?.requestSubmit(), 100);
	}

	// Auto-save on field change with debounce
	let saveTimeout: ReturnType<typeof setTimeout>;
	function autoSave(formId: string) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			document.getElementById(formId)?.requestSubmit();
		}, 1000); // 1 second debounce
	}
</script>

<div class="container mx-auto max-w-5xl space-y-8 py-6">
	<h1 class="text-3xl font-bold tracking-tight">Digital Dashboard Configuration</h1>
	<p class="text-muted-foreground">
		Configure your car's digital dashboard display, gauges, alerts, and dynamic conditions.
	</p>

	<Tabs value="view" class="w-full">
		<TabsList class="mb-8 grid grid-cols-4">
			<TabsTrigger value="view" class="flex items-center gap-2">
				<AlertCircle class="h-4 w-4" />
				<span>Basic Settings</span>
			</TabsTrigger>
			<TabsTrigger value="gauges" class="flex items-center gap-2">
				<Gauge class="h-4 w-4" />
				<span>Gauges</span>
				<Badge variant="secondary" class="ml-1">{$gaugesForm.items.length}</Badge>
			</TabsTrigger>
			<TabsTrigger value="alerts" class="flex items-center gap-2">
				<Bell class="h-4 w-4" />
				<span>Alerts</span>
				<Badge variant="secondary" class="ml-1">{$alertsForm.items.length}</Badge>
			</TabsTrigger>
			<TabsTrigger value="dynamic" class="flex items-center gap-2">
				<Activity class="h-4 w-4" />
				<span>Dynamic</span>
				<Badge variant="secondary" class="ml-1">{$dynamicForm.items.length}</Badge>
			</TabsTrigger>
		</TabsList>

		<!-- View Settings Tab -->
		<TabsContent value="view">
			<Card>
				<CardHeader>
					<CardTitle>View Settings</CardTitle>
					<CardDescription>Configure the basic settings for your dashboard view</CardDescription>
				</CardHeader>
				<form method="POST" use:enhanceView id="view-form">
					<CardContent class="space-y-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="name">View Name</Label>
								<Input
									id="name"
									type="text"
									bind:value={$viewForm.name}
									placeholder="Enter view name"
									oninput={() => autoSave('view-form')}
								/>
							</div>

							<div class="space-y-2">
								<Label for="enabled">Enabled</Label>
								<div class="pt-2">
									<Switch
										id="enabled"
										bind:checked={$viewForm.enabled}
										onchange={() => autoSave('view-form')}
									/>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="background">Background</Label>
							<Select.Root
								bind:value={$viewForm.background}
								onchange={() => autoSave('view-form')}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select background" />
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="BACKGROUND_BLACK.png">Black</Select.Item>
									<Select.Item value="BACKGROUND_FLARE.png">Flare</Select.Item>
									<Select.Item value="BACKGROUND_GALAXY.png">Galaxy</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={viewSubmitting}>
							{#if viewSubmitting}
								<span class="mr-2">Saving...</span>
							{:else}
								<Save class="mr-2 h-4 w-4" />
								<span>Save View</span>
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>

		<!-- Gauges Tab -->
		<TabsContent value="gauges">
			<Card>
				<CardHeader>
					<CardTitle>Gauges Configuration</CardTitle>
					<CardDescription
						>Configure the gauges displayed on your dashboard (max {$gaugesForm.items[0]
							?.count[0] || 3})</CardDescription
					>
				</CardHeader>
				<form method="POST" use:enhanceGauges id="gauges-form">
					<CardContent class="space-y-6">
						{#each $gaugesForm.items as gauge, i}
							<div class="bg-muted/20 space-y-4 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Gauge #{i + 1}</h4>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onclick={() => removeGauge(i)}
									>
										<Trash2 class="mr-2 h-4 w-4" />
										Remove
									</Button>
								</div>
								<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<div class="space-y-2">
										<Label for={`gauge-pid-${i}`}>PID</Label>
										<Input
											id={`gauge-pid-${i}`}
											type="text"
											bind:value={gauge.pid}
											placeholder="PID"
											oninput={() => autoSave('gauges-form')}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`gauge-name-${i}`}>Name</Label>
										<Input
											id={`gauge-name-${i}`}
											type="text"
											bind:value={gauge.name}
											placeholder="Name"
											oninput={() => autoSave('gauges-form')}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`gauge-theme-${i}`}>Theme</Label>
										<Select.Root bind:value={gauge.theme} onchange={() => autoSave('gauges-form')}>
											<Select.Trigger class="w-full">
												<Select.Value placeholder="Select theme" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="THEME_STOCK_ST">Stock ST</Select.Item>
												<Select.Item value="THEME_STOCK_RS">Stock RS</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</div>
						{/each}

						{#if $gaugesForm.items.length < ($gaugesForm.items[0]?.count[0] || 3)}
							<Button type="button" variant="outline" class="w-full" onclick={addGauge}>
								<Plus class="mr-2 h-4 w-4" />
								Add Gauge
							</Button>
						{/if}
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={gaugesSubmitting}>
							{#if gaugesSubmitting}
								<span class="mr-2">Saving...</span>
							{:else}
								<Save class="mr-2 h-4 w-4" />
								<span>Save Gauges</span>
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>

		<!-- Alerts Tab -->
		<TabsContent value="alerts">
			<Card>
				<CardHeader>
					<CardTitle>Alerts Configuration</CardTitle>
					<CardDescription
						>Configure alerts for your dashboard (max {$alertsForm.items[0]?.count ||
							5})</CardDescription
					>
				</CardHeader>
				<form method="POST" use:enhanceAlerts id="alerts-form">
					<CardContent class="space-y-6">
						{#each $alertsForm.items as alert, i}
							<div class="bg-muted/20 space-y-4 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Alert #{i + 1}</h4>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onclick={() => removeAlert(i)}
									>
										<Trash2 class="mr-2 h-4 w-4" />
										Remove
									</Button>
								</div>
								<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<div class="space-y-2">
										<Label for={`alert-pid-${i}`}>PID</Label>
										<Input
											id={`alert-pid-${i}`}
											type="text"
											bind:value={alert.pid}
											placeholder="PID"
											oninput={() => autoSave('alerts-form')}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`alert-compare-${i}`}>Comparison</Label>
										<Select.Root
											bind:value={alert.compare}
											onchange={() => autoSave('alerts-form')}
										>
											<Select.Trigger class="w-full">
												<Select.Value placeholder="Select comparison" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="Equal">Equal</Select.Item>
												<Select.Item value="Less Than">Less Than</Select.Item>
												<Select.Item value="Less Than Or Equal To">Less Than Or Equal</Select.Item>
												<Select.Item value="Greater Than">Greater Than</Select.Item>
												<Select.Item value="Greater Than Or Equal To"
													>Greater Than Or Equal</Select.Item
												>
												<Select.Item value="Not Equal">Not Equal</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
									<div class="space-y-2 sm:col-span-2 lg:col-span-1">
										<Label for={`alert-message-${i}`}>Message</Label>
										<Input
											id={`alert-message-${i}`}
											type="text"
											bind:value={alert.message}
											placeholder="Alert message"
											oninput={() => autoSave('alerts-form')}
										/>
									</div>
								</div>
							</div>
						{/each}

						{#if $alertsForm.items.length < ($alertsForm.items[0]?.count || 5)}
							<Button type="button" variant="outline" class="w-full" onclick={addAlert}>
								<Plus class="mr-2 h-4 w-4" />
								Add Alert
							</Button>
						{/if}
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={alertsSubmitting}>
							{#if alertsSubmitting}
								<span class="mr-2">Saving...</span>
							{:else}
								<Save class="mr-2 h-4 w-4" />
								<span>Save Alerts</span>
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>

		<!-- Dynamic Conditions Tab -->
		<TabsContent value="dynamic">
			<Card>
				<CardHeader>
					<CardTitle>Dynamic Conditions</CardTitle>
					<CardDescription
						>Configure dynamic conditions for your dashboard (max {$dynamicForm.items[0]
							?.count || 2})</CardDescription
					>
				</CardHeader>
				<form method="POST" use:enhanceDynamic id="dynamic-form">
					<CardContent class="space-y-6">
						{#each $dynamicForm.items as condition, i}
							<div class="bg-muted/20 space-y-4 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<h4 class="font-medium">Condition #{i + 1}</h4>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onclick={() => removeDynamicCondition(i)}
									>
										<Trash2 class="mr-2 h-4 w-4" />
										Remove
									</Button>
								</div>
								<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<div class="space-y-2">
										<Label for={`dynamic-pid-${i}`}>PID</Label>
										<Input
											id={`dynamic-pid-${i}`}
											type="text"
											bind:value={condition.pid}
											placeholder="PID"
											oninput={() => autoSave('dynamic-form')}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`dynamic-compare-${i}`}>Comparison</Label>
										<Select.Root
											bind:value={condition.compare}
											onchange={() => autoSave('dynamic-form')}
										>
											<Select.Trigger class="w-full">
												<Select.Value placeholder="Select comparison" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="EQUAL">Equal</Select.Item>
												<Select.Item value="LESS_THAN">Less Than</Select.Item>
												<Select.Item value="GREATER_THAN">Greater Than</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
									<div class="space-y-2">
										<Label for={`dynamic-thresh-${i}`}>Threshold</Label>
										<Input
											id={`dynamic-thresh-${i}`}
											type="number"
											bind:value={condition.thresh}
											placeholder="Threshold"
											oninput={() => autoSave('dynamic-form')}
										/>
									</div>
									<div class="space-y-2">
										<Label for={`dynamic-priority-${i}`}>Priority</Label>
										<Select.Root
											bind:value={condition.priority}
											onchange={() => autoSave('dynamic-form')}
										>
											<Select.Trigger class="w-full">
												<Select.Value placeholder="Select priority" />
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="Low">Low</Select.Item>
												<Select.Item value="Medium">Medium</Select.Item>
												<Select.Item value="High">High</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</div>
						{/each}

						{#if $dynamicForm.items.length < ($dynamicForm.items[0]?.count || 2)}
							<Button type="button" variant="outline" class="w-full" onclick={addDynamicCondition}>
								<Plus class="mr-2 h-4 w-4" />
								Add Dynamic Condition
							</Button>
						{/if}
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={dynamicSubmitting}>
							{#if dynamicSubmitting}
								<span class="mr-2">Saving...</span>
							{:else}
								<Save class="mr-2 h-4 w-4" />
								<span>Save Dynamic Conditions</span>
							{/if}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</TabsContent>
	</Tabs>
</div>

<style>
	:global(.dark) {
		--background: 222.2 84% 4.9%;
		--foreground: 210 40% 98%;
	}
</style>
