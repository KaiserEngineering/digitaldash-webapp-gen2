<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { Bell, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-svelte';
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
	import type { DigitalDashAlert } from '$schemas/digitaldash';

	let { data } = $props();

	const pids = data.pids || [];
	const compareOps = data.options?.alert_comparison || [];

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(AlertsFormSchema),
		onUpdate: async (data) => {
			console.log('Updated');
			try {
				const result = await updateFullConfig((config) => {
					config.alert = data.form.data.items as DigitalDashAlert[];
				}, 'Alerts saved!');

				if (result.success && result.config) {
					if (result.config) {
						form.update(
							($form) => {
								$form.items = result.config!.alert;
								return $form;
							},
							{ taint: false }
						);
					}
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
	{#snippet children()}
		<div class="space-y-4">
			{#each $form.items as DigitalDashAlert[] as alert, i (alert.index ?? i)}
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
										? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-sm hover:shadow-lg hover:shadow-emerald-100/50'
										: 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/30 opacity-75 hover:opacity-90'
								}`}
							>
								<!-- Enhanced Header -->
								<Collapsible.Trigger class="w-full text-left">
									<div
										class={`flex items-center justify-between p-6 transition-all duration-200 ${
											alert.enable === 'Enabled' ? 'hover:bg-emerald-50/50' : 'hover:bg-slate-50/50'
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
													<h4 class="text-lg font-semibold text-slate-800">
														Alert #{i + 1}
													</h4>
													{#if alert.enable === 'Enabled'}
														<CheckCircle2 class="h-4 w-4 text-emerald-500" />
													{:else}
														<AlertTriangle class="h-4 w-4 text-slate-400" />
													{/if}
												</div>
												<div class="flex items-center gap-2 text-sm">
													<span
														class={`font-medium ${
															alert.enable === 'Enabled' ? 'text-emerald-700' : 'text-slate-500'
														}`}
													>
														{alert.pid || 'No PID selected'}
													</span>
													<span class="text-slate-400">•</span>
													<span
														class={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
															alert.enable === 'Enabled'
																? 'bg-emerald-100 text-emerald-700'
																: 'bg-slate-100 text-slate-600'
														}`}
													>
														{alert.enable === 'Enabled' ? 'Active' : 'Inactive'}
													</span>
												</div>
											</div>
										</div>

										<ChevronDown
											class="h-5 w-5 text-slate-400 transition-all duration-300 group-hover:text-slate-600 data-[state=open]:rotate-180"
										/>
									</div>
								</Collapsible.Trigger>

								<!-- Enhanced Content -->
								<Collapsible.Content>
									<div class="border-t border-slate-100 bg-white/50 p-6">
										<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
											<!-- PID Selection -->
											<div class="lg:col-span-2">
												<PIDSelect
													bind:pidValue={$form.items[i].pid}
													bind:unitValue={$form.items[i].units}
													{pids}
													disabled={alert.enable !== 'Enabled'}
													pidLabel="Parameter ID"
													unitLabel="Measurement Unit"
													class="space-y-4"
													key={`alert-${alert.index ?? i}`}
												/>
											</div>

											<!-- Comparison Operator -->
											<div class="space-y-3">
												<Label class="text-sm font-semibold text-slate-700"
													>Comparison Operator</Label
												>
												<Select.Root
													bind:value={alert.compare}
													disabled={alert.enable !== 'Enabled'}
													type="single"
												>
													<Select.Trigger
														class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
															alert.enable === 'Enabled'
																? 'border-slate-200 bg-white hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
																: 'border-slate-100 bg-slate-50'
														}`}
													>
														<span class={alert.compare ? 'text-slate-800' : 'text-slate-400'}>
															{alert.compare || 'Select operator'}
														</span>
													</Select.Trigger>
													<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
														{#each compareOps as op}
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
												<Label class="text-sm font-semibold text-slate-700">Threshold Value</Label>
												<Input
													type="number"
													bind:value={alert.threshold}
													class={`h-12 rounded-xl border-2 transition-all duration-200 ${
														alert.enable === 'Enabled'
															? 'border-slate-200 bg-white hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
															: 'border-slate-100 bg-slate-50'
													}`}
													disabled={alert.enable !== 'Enabled'}
													placeholder="Enter threshold value"
												/>
											</div>

											<!-- Alert Message -->
											<div class="space-y-3 lg:col-span-2">
												<Label class="text-sm font-semibold text-slate-700">Alert Message</Label>
												<Input
													type="text"
													bind:value={alert.message}
													class={`h-12 rounded-xl border-2 transition-all duration-200 ${
														alert.enable === 'Enabled'
															? 'border-slate-200 bg-white hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
															: 'border-slate-100 bg-slate-50'
													}`}
													disabled={alert.enable !== 'Enabled'}
													placeholder="Enter custom alert message"
												/>
											</div>

											<!-- Enable/Disable Toggle -->
											<div
												class="flex items-center justify-between rounded-xl bg-slate-50/50 p-4 lg:col-span-2"
											>
												<div class="flex flex-col">
													<Label class="text-sm font-semibold text-slate-700">Alert Status</Label>
													<p class="text-xs text-slate-500">
														{alert.enable === 'Enabled'
															? 'This alert is currently active'
															: 'This alert is currently inactive'}
													</p>
												</div>
												<Switch
													checked={alert.enable === 'Enabled'}
													onCheckedChange={(checked) =>
														(alert.enable = checked ? 'Enabled' : 'Disabled')}
													class="data-[state=checked]:bg-emerald-500"
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
	{/snippet}

	{#snippet footerContent()}
		<div
			class="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 md:flex-row"
		>
			<div class="text-sm text-slate-500">
				{Array.isArray($form.items)
					? ($form.items as DigitalDashAlert[]).filter(
							(alert: DigitalDashAlert) => alert.enable === 'Enabled'
						).length
					: 0} of {Array.isArray($form.items) ? $form.items.length : 0} alerts enabled
			</div>
			<Button
				type="submit"
				disabled={$submitting}
				class={`h-12 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200 ${
					$submitting
						? 'bg-slate-400'
						: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-200'
				} text-white`}
			>
				{#if $submitting}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Saving Changes...
					</div>
				{:else}
					Save Alert Configuration
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
