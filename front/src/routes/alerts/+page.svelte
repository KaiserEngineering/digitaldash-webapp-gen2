<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { Bell, ChevronDown, AlertTriangle, CheckCircle2, Save } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { Motion } from 'motion-start';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { AlertsFormSchema } from './alertsFormSchema';
	import { toast } from 'svelte-5-french-toast';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { type DigitalDashAlert } from '$schemas/digitaldash';

	let { data } = $props();

	const pids = data.pids || [];
	const compareOps = data.options?.alert_comparison || [];

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(AlertsFormSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel();
			try {
				const result = await updateFullConfig((config) => {
					// Convert object back to array for backend
					const alertsArray = Object.values(formData.data).map((alert) => {
						// Remove index field as it's only for frontend
						const { index: _, ...alertWithoutIndex } = alert as DigitalDashAlert & {
							index?: number;
						};
						return alertWithoutIndex;
					});
					config.alert = alertsArray;
				});

				if (result.success && result.config) {
					// Convert returned array back to object for form
					const alertsObject: Record<string, DigitalDashAlert & { index: number }> = {};
					result.config.alert.forEach((alert: DigitalDashAlert, index: number) => {
						alertsObject[index] = { ...alert, index };
					});
					Object.assign($form, alertsObject);
					toast.success('Alerts saved successfully!');
				} else {
					toast.error('Failed to save alerts');
				}
			} catch (error) {
				console.error('Failed to save alerts:', error);
				toast.error('Failed to save alerts');
			}
		}
	});
</script>

<PageCard
	title="Alert Configuration"
	description="Configure and manage your system alerts with precision."
	icon={Bell}
	{enhance}
>
	<div class="space-y-4">
		{#each Object.entries($form) as [key, alertRaw], i (key)}
			{@const alert = alertRaw as DigitalDashAlert}
			<div
				in:slide={{ duration: 300, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 400 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<Collapsible.Root>
						<div
							class={`group relative rounded-2xl border-2 transition-all duration-300 ${
								alert.enable === 'Enabled'
									? 'border-emerald-200  shadow-sm hover:shadow-lg hover:shadow-emerald-100/50'
									: 'border-border  opacity-75 hover:opacity-90'
							}`}
						>
							<!-- Enhanced Header -->
							<Collapsible.Trigger class="w-full text-left">
								<div
									class={`flex items-center justify-between p-6 transition-all duration-200 ${
										alert.enable === 'Enabled' ? 'hover:bg-emerald-50/50' : 'hover:bg-muted/50'
									}`}
								>
									<div class="flex items-center gap-4">
										<!-- Status Indicator -->
										<div
											class={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${
												alert.enable === 'Enabled'
													? 'bg-gradient-to-br from-emerald-500 to-emerald-600 group-hover:shadow-emerald-200'
													: 'bg-gradient-to-br from-slate-400 to-slate-500'
											}`}
										>
											{i + 1}
										</div>

										<div class="flex flex-col">
											<div class="flex items-center gap-2">
												<h4 class="text-foreground text-lg font-semibold">
													Alert #{i + 1}
												</h4>
												{#if alert.enable === 'Enabled'}
													<CheckCircle2 class="h-4 w-4 text-emerald-500" />
												{:else}
													<AlertTriangle class="text-muted-foreground h-4 w-4" />
												{/if}
											</div>
											<div class="flex items-center gap-2 text-sm">
												<span
													class={`font-medium ${
														alert.enable === 'Enabled'
															? 'text-emerald-700'
															: 'text-muted-foreground'
													}`}
												>
													{alert.pid || 'No PID selected'}
												</span>
												<span class="text-muted-foreground">•</span>
												<span
													class={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														alert.enable === 'Enabled'
															? 'bg-emerald-100 text-emerald-700'
															: 'bg-muted text-muted-foreground'
													}`}
												>
													{alert.enable === 'Enabled' ? 'Active' : 'Inactive'}
												</span>
											</div>
										</div>
									</div>

									<ChevronDown
										class="text-muted-foreground group-hover:text-foreground h-5 w-5 transition-all duration-300 data-[state=open]:rotate-180"
									/>
								</div>
							</Collapsible.Trigger>

							<!-- Enhanced Content -->
							<Collapsible.Content>
								<div class="border-border bg-card/50 border-t p-6">
									<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<!-- Enable/Disable Toggle -->
										<div
											class="bg-muted/50 flex items-center justify-between rounded-xl p-4 lg:col-span-2"
										>
											<div class="flex flex-col">
												<Label class="text-foreground text-sm font-semibold">Alert Status</Label>
												<p class="text-muted-foreground text-xs">
													{alert.enable === 'Enabled'
														? 'This alert is currently active'
														: 'This alert is currently inactive'}
												</p>
											</div>
											<Switch
												checked={alert.enable === 'Enabled'}
												onCheckedChange={(checked) =>
													($form[key].enable = checked ? 'Enabled' : 'Disabled')}
												class="data-[state=checked]:bg-success data-[state=checked]:border-success/30 border border-muted bg-muted"
											/>
										</div>

										<!-- PID Selection -->
										<div class="lg:col-span-2">
											<PIDSelect
												bind:pidValue={$form[key].pid}
												bind:unitValue={$form[key].units}
												{pids}
												disabled={alert.enable !== 'Enabled'}
												pidLabel="Parameter ID"
												unitLabel="Measurement Unit"
												class="space-y-4"
												key={`alert-${key}`}
											/>
										</div>

										<!-- Comparison Operator -->
										<div class="space-y-3">
											<Label class="text-foreground text-sm font-semibold"
												>Comparison Operator</Label
											>
											<Select.Root
												bind:value={$form[key].compare}
												disabled={alert.enable !== 'Enabled'}
												type="single"
											>
												<Select.Trigger
													class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
														alert.enable === 'Enabled'
															? 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
															: 'border-border bg-muted'
													}`}
												>
													<span class={alert.compare ? 'text-foreground' : 'text-muted-foreground'}>
														{alert.compare || 'Select operator'}
													</span>
												</Select.Trigger>
												<Select.Content class="border-border rounded-xl border-2 shadow-xl">
													{#each compareOps as op (op)}
														<Select.Item
															value={op}
															label={op}
															class="rounded-lg py-3 hover:bg-emerald-50"
														>
															{op}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>

										<!-- Threshold Value -->
										<div class="space-y-3">
											<Label class="text-foreground text-sm font-semibold">Threshold Value</Label>
											<Input
												type="number"
												bind:value={$form[key].threshold}
												class={`h-12 rounded-xl border-2 transition-all duration-200 ${
													alert.enable === 'Enabled'
														? 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
														: 'border-border bg-muted'
												}`}
												disabled={alert.enable !== 'Enabled'}
												placeholder="Enter threshold value"
											/>
										</div>

										<!-- Alert Message -->
										<div class="space-y-3 lg:col-span-2">
											<Label class="text-foreground text-sm font-semibold">Alert Message</Label>
											<Input
												type="text"
												bind:value={$form[key].message}
												class={`h-12 rounded-xl border-2 transition-all duration-200 ${
													alert.enable === 'Enabled'
														? 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
														: 'border-border bg-muted'
												}`}
												disabled={alert.enable !== 'Enabled'}
												placeholder="Enter custom alert message"
											/>
										</div>
									</div>
								</div>
							</Collapsible.Content>
						</div>
					</Collapsible.Root>
				</Motion.div>
			</div>
		{/each}
	</div>

	{#snippet footerContent()}
		<div
			class="border-border mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row"
		>
			<div class="text-muted-foreground text-sm">
				{Object.values($form).filter(
					(alert) =>
						alert && typeof alert === 'object' && 'enable' in alert && alert.enable === 'Enabled'
				).length} of {Object.keys($form).length} alerts enabled
			</div>
			<Button
				type="submit"
				disabled={$submitting}
				class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold text-gray-800 shadow-lg transition-all duration-200"
			>
				{#if $submitting}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Saving...
				{:else}
					<Save class="h-4 w-4" />
					Save Alert Configuration
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
