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
	import {
		Gauge,
		Bell,
		Activity,
		Save,
		Plus,
		Trash2,
		ChevronRight,
		Settings,
		FastForward as SpeedIcon
	} from 'lucide-svelte';
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

	// Active tab state
	let activeTab = $state('view');
</script>

<div class="from-background to-background/80 min-h-screen bg-gradient-to-b">
	<div class="container mx-auto max-w-6xl px-4">
		<div class="mb-10 flex items-center justify-between">
			<div>
				<h1
					class="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent"
				>
					Digital Dashboard
				</h1>
				<p class="text-muted-foreground">
					Configure your car's digital dashboard display, gauges, alerts, and dynamic conditions.
				</p>
			</div>
			<div class="hidden md:block">
				<SpeedIcon class="text-primary/80 h-16 w-16" />
			</div>
		</div>

		<Tabs value={activeTab} class="w-full">
			<div class="mb-8 flex justify-center">
				<TabsList class="grid w-full max-w-3xl grid-cols-4 rounded-xl p-1">
					<TabsTrigger
						value="view"
						onclick={() => (activeTab = 'view')}
						class="{activeTab === 'view' ? 'active': ''} data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg cursor-pointer"
					>
						<div class="flex items-center gap-2">
							<Settings class="h-4 w-4" />
							<span>Settings</span>
						</div>
					</TabsTrigger>
					<TabsTrigger
						value="gauges"
						onclick={() => (activeTab = 'gauges')}
						class="{activeTab === 'view' ? 'active': ''} data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg cursor-pointer"
					>
						<div class="flex items-center gap-2">
							<Gauge class="h-4 w-4" />
							<span>Gauges</span>
							<Badge variant="outline" class="bg-primary/5 ml-1">{$gaugesForm.items.length}</Badge>
						</div>
					</TabsTrigger>
					<TabsTrigger
						value="alerts"
						onclick={() => (activeTab = 'alerts')}
						class="{activeTab === 'view' ? 'active': ''} data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg cursor-pointer"
					>
						<div class="flex items-center gap-2">
							<Bell class="h-4 w-4" />
							<span>Alerts</span>
							<Badge variant="outline" class="bg-primary/5 ml-1">{$alertsForm.items.length}</Badge>
						</div>
					</TabsTrigger>
					<TabsTrigger
						value="dynamic"
						onclick={() => (activeTab = 'dynamic')}
						class="{activeTab === 'view' ? 'active': ''} data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg cursor-pointer"
					>
						<div class="flex items-center gap-2">
							<Activity class="h-4 w-4" />
							<span>Dynamic</span>
							<Badge variant="outline" class="bg-primary/5 ml-1">{$dynamicForm.items.length}</Badge>
						</div>
					</TabsTrigger>
				</TabsList>
			</div>

			<!-- View Settings Tab -->
			<TabsContent value="view">
				<Card class="border-none shadow-lg">
					<CardHeader class="bg-primary/5 rounded-t-xl">
						<CardTitle class="flex items-center gap-2">
							<Settings class="text-primary h-5 w-5" />
							View Settings
						</CardTitle>
						<CardDescription>Configure the basic settings for your dashboard view</CardDescription>
					</CardHeader>
					<form method="POST" use:enhanceView id="view-form">
						<CardContent class="space-y-6 p-6">
							<div class="grid gap-6 sm:grid-cols-2">
								<div class="space-y-2">
									<Label for="name" class="text-sm font-medium">View Name</Label>
									<Input
										id="name"
										type="text"
										bind:value={$viewForm.name}
										placeholder="Enter view name"
										oninput={() => autoSave('view-form')}
										class="border-input/50 focus-visible:ring-primary/50"
									/>
								</div>

								<div class="space-y-2">
									<Label for="enabled" class="text-sm font-medium">Enabled</Label>
									<div class="flex h-10 items-center space-x-2">
										<Switch
											id="enabled"
											bind:checked={$viewForm.enabled}
											onchange={() => autoSave('view-form')}
										/>
										<span class="text-muted-foreground text-sm">
											{$viewForm.enabled ? 'Active' : 'Inactive'}
										</span>
									</div>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="background" class="text-sm font-medium">Background</Label>
								<Select.Root
									bind:value={$viewForm.background}
									onchange={() => autoSave('view-form')}
								>
									<Select.Trigger class="border-input/50 focus:ring-primary/50 w-full">
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
						<CardFooter class="bg-muted/10 rounded-b-xl px-6 py-4">
							<Button
								type="submit"
								disabled={viewSubmitting}
								class="gap-2 transition-all hover:gap-3"
							>
								{#if viewSubmitting}
									<span class="mr-2">Saving...</span>
								{:else}
									<Save class="h-4 w-4" />
									<span>Save View</span>
									<ChevronRight class="h-3 w-3 opacity-70" />
								{/if}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>

			<!-- Gauges Tab -->
			<TabsContent value="gauges">
				<Card class="border-none shadow-lg">
					<CardHeader class="bg-primary/5 rounded-t-xl">
						<CardTitle class="flex items-center gap-2">
							<Gauge class="text-primary h-5 w-5" />
							Gauges Configuration
						</CardTitle>
						<CardDescription
							>Configure the gauges displayed on your dashboard (max {$gaugesForm.items[0]
								?.count[0] || 3})</CardDescription
						>
					</CardHeader>
					<form method="POST" use:enhanceGauges id="gauges-form">
						<CardContent class="space-y-6 p-6">
							{#each $gaugesForm.items as gauge, i}
								<div
									class="bg-muted/10 hover:bg-muted/20 border-border/50 group relative space-y-4 rounded-lg border p-5 transition-colors"
								>
									<div class="flex items-center justify-between">
										<h4 class="flex items-center gap-2 font-medium">
											<span
												class="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
											>
												{i + 1}
											</span>
											Gauge Configuration
										</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removeGauge(i)}
											class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
										>
											<Trash2 class="h-4 w-4" />
											<span class="sr-only">Remove</span>
										</Button>
									</div>
									<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										<div class="space-y-2">
											<Label for={`gauge-pid-${i}`} class="text-sm font-medium">PID</Label>
											<Input
												id={`gauge-pid-${i}`}
												type="text"
												bind:value={gauge.pid}
												placeholder="PID"
												oninput={() => autoSave('gauges-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
										<div class="space-y-2">
											<Label for={`gauge-name-${i}`} class="text-sm font-medium">Name</Label>
											<Input
												id={`gauge-name-${i}`}
												type="text"
												bind:value={gauge.name}
												placeholder="Name"
												oninput={() => autoSave('gauges-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
										<div class="space-y-2">
											<Label for={`gauge-theme-${i}`} class="text-sm font-medium">Theme</Label>
											<Select.Root
												bind:value={gauge.theme}
												onchange={() => autoSave('gauges-form')}
											>
												<Select.Trigger class="border-input/50 focus:ring-primary/50 w-full">
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
								<Button
									type="button"
									variant="outline"
									class="border-primary/30 hover:border-primary/70 hover:bg-primary/5 w-full border-dashed"
									onclick={addGauge}
								>
									<Plus class="mr-2 h-4 w-4" />
									Add Gauge
								</Button>
							{/if}
						</CardContent>
						<CardFooter class="bg-muted/10 rounded-b-xl px-6 py-4">
							<Button
								type="submit"
								disabled={gaugesSubmitting}
								class="gap-2 transition-all hover:gap-3"
							>
								{#if gaugesSubmitting}
									<span class="mr-2">Saving...</span>
								{:else}
									<Save class="h-4 w-4" />
									<span>Save Gauges</span>
									<ChevronRight class="h-3 w-3 opacity-70" />
								{/if}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>

			<!-- Alerts Tab -->
			<TabsContent value="alerts">
				<Card class="border-none shadow-lg">
					<CardHeader class="bg-primary/5 rounded-t-xl">
						<CardTitle class="flex items-center gap-2">
							<Bell class="text-primary h-5 w-5" />
							Alerts Configuration
						</CardTitle>
						<CardDescription
							>Configure alerts for your dashboard (max {$alertsForm.items[0]?.count ||
								5})</CardDescription
						>
					</CardHeader>
					<form method="POST" use:enhanceAlerts id="alerts-form">
						<CardContent class="space-y-6 p-6">
							{#each $alertsForm.items as alert, i}
								<div
									class="bg-muted/10 hover:bg-muted/20 border-border/50 group relative space-y-4 rounded-xl border p-5 transition-colors"
								>
									<div class="flex items-center justify-between">
										<h4 class="flex items-center gap-2 font-medium">
											<span
												class="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
											>
												{i + 1}
											</span>
											Alert Configuration
										</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removeAlert(i)}
											class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
										>
											<Trash2 class="h-4 w-4" />
											<span class="sr-only">Remove</span>
										</Button>
									</div>
									<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										<div class="space-y-2">
											<Label for={`alert-pid-${i}`} class="text-sm font-medium">PID</Label>
											<Input
												id={`alert-pid-${i}`}
												type="text"
												bind:value={alert.pid}
												placeholder="PID"
												oninput={() => autoSave('alerts-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
										<div class="space-y-2">
											<Label for={`alert-compare-${i}`} class="text-sm font-medium"
												>Comparison</Label
											>
											<Select.Root
												bind:value={alert.compare}
												onchange={() => autoSave('alerts-form')}
											>
												<Select.Trigger class="border-input/50 focus:ring-primary/50 w-full">
													<Select.Value placeholder="Select comparison" />
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="Equal">Equal</Select.Item>
													<Select.Item value="Less Than">Less Than</Select.Item>
													<Select.Item value="Less Than Or Equal To">Less Than Or Equal</Select.Item
													>
													<Select.Item value="Greater Than">Greater Than</Select.Item>
													<Select.Item value="Greater Than Or Equal To"
														>Greater Than Or Equal</Select.Item
													>
													<Select.Item value="Not Equal">Not Equal</Select.Item>
												</Select.Content>
											</Select.Root>
										</div>
										<div class="space-y-2 sm:col-span-2 lg:col-span-1">
											<Label for={`alert-message-${i}`} class="text-sm font-medium">Message</Label>
											<Input
												id={`alert-message-${i}`}
												type="text"
												bind:value={alert.message}
												placeholder="Alert message"
												oninput={() => autoSave('alerts-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
									</div>
								</div>
							{/each}

							{#if $alertsForm.items.length < ($alertsForm.items[0]?.count || 5)}
								<Button
									type="button"
									variant="outline"
									class="border-primary/30 hover:border-primary/70 hover:bg-primary/5 w-full border-dashed"
									onclick={addAlert}
								>
									<Plus class="mr-2 h-4 w-4" />
									Add Alert
								</Button>
							{/if}
						</CardContent>
						<CardFooter class="bg-muted/10 rounded-b-xl px-6 py-4">
							<Button
								type="submit"
								disabled={alertsSubmitting}
								class="gap-2 transition-all hover:gap-3"
							>
								{#if alertsSubmitting}
									<span class="mr-2">Saving...</span>
								{:else}
									<Save class="h-4 w-4" />
									<span>Save Alerts</span>
									<ChevronRight class="h-3 w-3 opacity-70" />
								{/if}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>

			<!-- Dynamic Conditions Tab -->
			<TabsContent value="dynamic">
				<Card class="border-none shadow-lg">
					<CardHeader class="bg-primary/5 rounded-t-xl">
						<CardTitle class="flex items-center gap-2">
							<Activity class="text-primary h-5 w-5" />
							Dynamic Conditions
						</CardTitle>
						<CardDescription
							>Configure dynamic conditions for your dashboard (max {$dynamicForm.items[0]?.count ||
								2})</CardDescription
						>
					</CardHeader>
					<form method="POST" use:enhanceDynamic id="dynamic-form">
						<CardContent class="space-y-6 p-6">
							{#each $dynamicForm.items as condition, i}
								<div
									class="bg-muted/10 hover:bg-muted/20 border-border/50 group relative space-y-4 rounded-xl border p-5 transition-colors"
								>
									<div class="flex items-center justify-between">
										<h4 class="flex items-center gap-2 font-medium">
											<span
												class="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
											>
												{i + 1}
											</span>
											Condition Configuration
										</h4>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onclick={() => removeDynamicCondition(i)}
											class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
										>
											<Trash2 class="h-4 w-4" />
											<span class="sr-only">Remove</span>
										</Button>
									</div>
									<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
										<div class="space-y-2">
											<Label for={`dynamic-pid-${i}`} class="text-sm font-medium">PID</Label>
											<Input
												id={`dynamic-pid-${i}`}
												type="text"
												bind:value={condition.pid}
												placeholder="PID"
												oninput={() => autoSave('dynamic-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
										<div class="space-y-2">
											<Label for={`dynamic-compare-${i}`} class="text-sm font-medium"
												>Comparison</Label
											>
											<Select.Root
												bind:value={condition.compare}
												onchange={() => autoSave('dynamic-form')}
											>
												<Select.Trigger class="border-input/50 focus:ring-primary/50 w-full">
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
											<Label for={`dynamic-thresh-${i}`} class="text-sm font-medium"
												>Threshold</Label
											>
											<Input
												id={`dynamic-thresh-${i}`}
												type="number"
												bind:value={condition.thresh}
												placeholder="Threshold"
												oninput={() => autoSave('dynamic-form')}
												class="border-input/50 focus-visible:ring-primary/50"
											/>
										</div>
										<div class="space-y-2">
											<Label for={`dynamic-priority-${i}`} class="text-sm font-medium"
												>Priority</Label
											>
											<Select.Root
												bind:value={condition.priority}
												onchange={() => autoSave('dynamic-form')}
											>
												<Select.Trigger class="border-input/50 focus:ring-primary/50 w-full">
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
								<Button
									type="button"
									variant="outline"
									class="border-primary/30 hover:border-primary/70 hover:bg-primary/5 w-full border-dashed"
									onclick={addDynamicCondition}
								>
									<Plus class="mr-2 h-4 w-4" />
									Add Dynamic Condition
								</Button>
							{/if}
						</CardContent>
						<CardFooter class="bg-muted/10 rounded-b-xl px-6 py-4">
							<Button
								type="submit"
								disabled={dynamicSubmitting}
								class="gap-2 transition-all hover:gap-3"
							>
								{#if dynamicSubmitting}
									<span class="mr-2">Saving...</span>
								{:else}
									<Save class="h-4 w-4" />
									<span>Save Dynamic Conditions</span>
									<ChevronRight class="h-3 w-3 opacity-70" />
								{/if}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</TabsContent>
		</Tabs>
	</div>
</div>

<style>
	:global(.dark) {
		--background: 222.2 84% 4.9%;
		--foreground: 210 40% 98%;
		--primary: 217.2 91.2% 59.8%;
		--primary-foreground: 222.2 47.4% 11.2%;
		--border: 217.2 32.6% 17.5%;
		--input: 217.2 32.6% 17.5%;
		--muted: 217.2 32.6% 17.5%;
		--muted-foreground: 215 20.2% 65.1%;
	}

	:global(:root) {
		--background: 0 0% 100%;
		--foreground: 222.2 84% 4.9%;
		--primary: 221.2 83.2% 53.3%;
		--primary-foreground: 210 40% 98%;
		--border: 214.3 31.8% 91.4%;
		--input: 214.3 31.8% 91.4%;
		--muted: 210 40% 96.1%;
		--muted-foreground: 215.4 16.3% 46.9%;
	}
</style>
