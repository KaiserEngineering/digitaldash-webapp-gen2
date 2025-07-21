<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';
	import { Settings, ChevronDown, Zap, AlertTriangle, CheckCircle2 } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { DynamicFormSchema } from './dynamicFormSchema';

	let { data } = $props();

	const pids = data.pids || [];
	const options = data.options || {};

	const { form, submitting, enhance } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DynamicFormSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel();

			try {
				const result = await updateFullConfig((config) => {
					// Convert object back to array for backend
					const dynamicArray = Object.values(formData.data);
					config.dynamic = dynamicArray;
				}, 'Dynamic rules saved!');

				if (result.success && result.config) {
					Object.assign($form, result.config.dynamic);
					// Cancel the default form submission and handle manually
			cancel();
					toast.success('Dynamic rules saved successfully!');
				} else {
					toast.error('Failed to save dynamic rules. Please try again.');
				}
			} catch (error) {
				console.error('Failed to save dynamic rules:', error);
				toast.error('Failed to save dynamic rules. Please try again.');
			}
		}
	});

	const compareOps = options.dynamic_comparison || [];

	// Enhanced priorities with colors and icons
	const priorities = [
		{
			name: 'High',
			color: 'from-red-500 to-red-600',
			bgColor: 'from-red-50 via-white to-red-50/30',
			borderColor: 'border-red-200',
			hoverColor: 'hover:bg-red-50/50'
		},
		{
			name: 'Medium',
			color: 'from-amber-500 to-amber-600',
			bgColor: 'from-amber-50 via-white to-amber-50/30',
			borderColor: 'border-amber-200',
			hoverColor: 'hover:bg-amber-50/50'
		},
		{
			name: 'Low',
			color: 'from-blue-500 to-blue-600',
			bgColor: 'from-blue-50 via-white to-blue-50/30',
			borderColor: 'border-blue-200',
			hoverColor: 'hover:bg-blue-50/50'
		}
	];
</script>

<PageCard
	title="Dynamic Rule Engine"
	description="Configure intelligent gauge behavior with priority-based dynamic rules."
	icon={Settings}
	{enhance}
>
	{#snippet children()}
		<div class="space-y-6">
			{#each Object.keys($form) as key, i (key)}
				<div
					in:slide={{ duration: 300, easing: quintOut }}
					out:slide={{ duration: 200, easing: quintOut }}
					animate:flip={{ duration: 400 }}
				>
					<Motion.div key={i} class="overflow-hidden">
						<Collapsible.Root>
							<div
								class={`group relative rounded-2xl border-2 transition-all duration-300 ${
									$form[key]?.enable === 'Enabled'
										? `${priorities[i].borderColor} bg-gradient-to-br ${priorities[i].bgColor} shadow-sm hover:shadow-lg`
										: 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/30 opacity-75 hover:opacity-90'
								}`}
							>
								<!-- Enhanced Header -->
								<Collapsible.Trigger class="w-full text-left">
									<div
										class={`flex items-center justify-between p-6 transition-all duration-200 ${
											$form[key]?.enable === 'Enabled'
												? priorities[i].hoverColor
												: 'hover:bg-slate-50/50'
										}`}
									>
										<div class="flex items-center gap-4">
											<div class="flex flex-col">
												<div class="flex items-center gap-3">
													<h4 class="text-lg font-semibold text-slate-800">
														{priorities[i].name}
													</h4>
													{#if $form[key]?.enable === 'Enabled'}
														<CheckCircle2 class="h-4 w-4 text-emerald-500" />
													{:else}
														<AlertTriangle class="h-4 w-4 text-slate-400" />
													{/if}
												</div>
												<div class="flex items-center gap-2 text-sm">
													<span
														class={`font-medium ${
															$form[key]?.enable === 'Enabled' ? 'text-slate-700' : 'text-slate-500'
														}`}
													>
														{$form[key]?.pid || 'No PID selected'}
													</span>
													<span class="text-slate-400">•</span>
													<span
														class={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
															$form[key]?.enable === 'Enabled'
																? `bg-${priorities[i].color.split('-')[1]}-100 text-${priorities[i].color.split('-')[1]}-700`
																: 'bg-slate-100 text-slate-600'
														}`}
													>
														{$form[key]?.enable === 'Enabled' ? 'Active' : 'Inactive'}
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
													bind:pidValue={$form[key].pid}
													bind:unitValue={$form[key].units}
													{pids}
													disabled={$form[key]?.enable !== 'Enabled'}
													pidLabel="Parameter ID"
													unitLabel="Measurement Unit"
													class="space-y-4"
													key={`rule-${i}`}
												/>
											</div>

											<!-- Comparison Operator -->
											<div class="space-y-3">
												<Label class="text-sm font-semibold text-slate-700"
													>Comparison Operator</Label
												>
												<Select.Root
													bind:value={$form[key].compare}
													disabled={$form[key]?.enable !== 'Enabled'}
													type="single"
												>
													<Select.Trigger
														class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
															$form[key]?.enable === 'Enabled'
																? `border-slate-200 bg-white hover:border-${priorities[i].color.split('-')[1]}-300 focus:border-${priorities[i].color.split('-')[1]}-400 focus:ring-2 focus:ring-${priorities[i].color.split('-')[1]}-100`
																: 'border-slate-100 bg-slate-50'
														}`}
													>
														<span class={$form[key]?.compare ? 'text-slate-800' : 'text-slate-400'}>
															{$form[key]?.compare || 'Select operator'}
														</span>
													</Select.Trigger>
													<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
														{#each compareOps as op}
															<Select.Item
																value={op}
																label={op}
																class={`rounded-lg py-3 hover:bg-${priorities[i].color.split('-')[1]}-50`}
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
													bind:value={$form[key].threshold}
													class={`h-12 rounded-xl border-2 transition-all duration-200 ${
														$form[key]?.enable === 'Enabled'
															? `border-slate-200 bg-white hover:border-${priorities[i].color.split('-')[1]}-300 focus:border-${priorities[i].color.split('-')[1]}-400 focus:ring-2 focus:ring-${priorities[i].color.split('-')[1]}-100`
															: 'border-slate-100 bg-slate-50'
													}`}
													disabled={$form[key]?.enable !== 'Enabled'}
													placeholder="Enter threshold value"
												/>
											</div>

											<!-- Enable/Disable Toggle -->
											<div
												class="flex items-center justify-between rounded-xl bg-slate-50/50 p-4 lg:col-span-2"
											>
												<div class="flex flex-col">
													<Label class="text-sm font-semibold text-slate-700">Rule Status</Label>
													<p class="text-xs text-slate-500">
														{$form[key]?.enable === 'Enabled'
															? 'This rule is currently active'
															: 'This rule is currently inactive'}
													</p>
												</div>
												<Switch
													checked={$form[key]?.enable === 'Enabled'}
													onCheckedChange={(checked) =>
														($form[key].enable = checked ? 'Enabled' : 'Disabled')}
													class={`data-[state=checked]:bg-${priorities[i].color.split('-')[1]}-500 border border-green-300 bg-green-200`}
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
			<div class="flex items-center gap-4 text-sm text-slate-500">
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4" />
					<span
						>{Object.values($form).filter((rule: any) => rule?.enable === 'Enabled').length} of 3 rules
						active</span
					>
				</div>
			</div>
			<Button
				type="submit"
				disabled={$submitting}
				class={`h-12 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200 ${
					$submitting
						? 'bg-slate-400'
						: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:shadow-indigo-200'
				} text-white`}
			>
				{#if $submitting}
					<div class="flex items-center gap-2">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Saving Rules...
					</div>
				{:else}
					Save Dynamic Rules
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
