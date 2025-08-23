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
	import { Settings, ChevronDown, Zap, TriangleAlert, CircleCheck, Save } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { DynamicFormSchema } from './dynamicFormSchema';
	import type { DigitalDashDynamic } from '$schemas/digitaldash';

	let { data } = $props();

	const pids = data.pids || [];
	const options = data.options || {};

	// Type helper function
	function isDynamicRule(rule: unknown): rule is DigitalDashDynamic {
		return rule !== null && typeof rule === 'object' && 'enable' in rule!;
	}

	const { form, submitting, enhance } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DynamicFormSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel();

			try {
				const result = await updateFullConfig((config) => {
					// Convert object back to array for backend
					const dynamicArray = Object.values(formData.data).map((rule) => {
						// Remove index field as it's only for frontend
						const { index: _, ...ruleWithoutIndex } = rule as DigitalDashDynamic & {
							index?: number;
						};

						// Ensure view_index is a number if present
						if (ruleWithoutIndex.view_index !== undefined && ruleWithoutIndex.view_index !== null) {
							ruleWithoutIndex.view_index = Number(ruleWithoutIndex.view_index);
						}

						// Ensure Low priority (Default in UI) is always enabled and has required defaults
						if (ruleWithoutIndex.priority === 'Low') {
							ruleWithoutIndex.enable = 'Enabled';
							// Provide default values for required fields that aren't configurable in Default UI
							if (!ruleWithoutIndex.pid) ruleWithoutIndex.pid = '';
							if (!ruleWithoutIndex.compare) ruleWithoutIndex.compare = 'Greater Than';
							if (ruleWithoutIndex.threshold === undefined || ruleWithoutIndex.threshold === null)
								ruleWithoutIndex.threshold = 0;
						}
						return ruleWithoutIndex;
					});
					config.dynamic = dynamicArray;
				});

				if (result.success && result.config) {
					// Convert returned array back to object for form
					const dynamicObject: Record<string, DigitalDashDynamic & { index: number }> = {};
					result.config.dynamic.forEach((rule: DigitalDashDynamic, index: number) => {
						const priority = rule.priority?.toLowerCase() || 'low';
						dynamicObject[priority] = { ...rule, index };
					});
					Object.assign($form, dynamicObject);
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
			name: 'Default',
			color: 'from-slate-500 to-slate-600',
			bgColor: 'from-slate-50 via-white to-slate-50/30',
			borderColor: 'border-slate-200',
			hoverColor: 'hover:bg-slate-50/50'
		}
	];
</script>

<PageCard
	title="Dynamic Rule Engine"
	description="Configure intelligent gauge behavior with priority-based dynamic rules."
	icon={Settings}
	{enhance}
>
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
								isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
									? `${priorities[i].borderColor} bg-card shadow-sm hover:shadow-lg`
									: 'bg-card border-border opacity-75 hover:opacity-90'
							}`}
						>
							<!-- Enhanced Header -->
							<Collapsible.Trigger class="w-full text-left">
								<div
									class={`flex items-center justify-between p-6 transition-all duration-200 ${
										isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
											? priorities[i].hoverColor
											: 'hover:bg-slate-50/50'
									}`}
								>
									<div class="flex items-center gap-4">
										<div class="flex flex-col">
											<div class="flex items-center gap-3">
												<h4 class="text-foreground text-lg font-semibold">
													{priorities[i].name}
												</h4>
												{#if isDynamicRule($form[key]) && $form[key].enable === 'Enabled'}
													<CircleCheck class="h-4 w-4 text-emerald-500" />
												{:else}
													<TriangleAlert class="text-muted-foreground h-4 w-4" />
												{/if}
											</div>
											<div class="flex items-center gap-2 text-sm">
												<span
													class={`font-medium ${
														isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
															? 'text-foreground'
															: 'text-muted-foreground'
													}`}
												>
													{#if isDynamicRule($form[key])}
														{#if priorities[i].name === 'Default'}
															View {$form[key].view_index !== undefined
																? $form[key].view_index
																: 'Not Set'}
														{:else}
															{$form[key].pid || 'No PID selected'}
														{/if}
													{:else}
														{priorities[i].name === 'Default' ? 'View Not Set' : 'No PID selected'}
													{/if}
												</span>
												<span class="text-muted-foreground">•</span>
												<span
													class={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
														isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
															? 'bg-success/20 text-success border-success/30 border'
															: 'bg-muted text-muted-foreground'
													}`}
												>
													{isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
														? 'Active'
														: 'Inactive'}
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
												<Label class="text-foreground text-sm font-semibold">Rule Status</Label>
												<p class="text-muted-foreground text-xs">
													{priorities[i].name === 'Default'
														? 'Default rule is always active'
														: isDynamicRule($form[key]) && $form[key].enable === 'Enabled'
															? 'This rule is currently active'
															: 'This rule is currently inactive'}
												</p>
											</div>
											{#if isDynamicRule($form[key]) && priorities[i].name !== 'Default'}
												<Switch
													checked={$form[key].enable === 'Enabled'}
													onCheckedChange={(checked) =>
														($form[key].enable = checked ? 'Enabled' : 'Disabled')}
													class={`data-[state=checked]:bg-${priorities[i].color.split('-')[1]}-500 border border-green-300 bg-green-200`}
												/>
											{:else if priorities[i].name === 'Default'}
												<div class="text-success flex items-center gap-2 text-sm font-medium">
													<CircleCheck class="h-4 w-4" />
													Always Enabled
												</div>
											{/if}
										</div>

										{#if priorities[i].name === 'Default'}
											<!-- View Index Selection for Default -->
											<div class="space-y-3 lg:col-span-2">
												<Label class="text-foreground text-sm font-semibold">View Index</Label>
												{#if isDynamicRule($form[key])}
													<Select.Root
														value={$form[key].view_index?.toString()}
														onValueChange={(value) =>
															($form[key].view_index = value ? Number(value) : undefined)}
														type="single"
													>
														<Select.Trigger
															class="border-border bg-card h-12 w-full rounded-xl border-2 transition-all duration-200 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
														>
															<span
																class={$form[key].view_index !== undefined
																	? 'text-foreground'
																	: 'text-muted-foreground'}
															>
																{$form[key].view_index !== undefined
																	? `View ${$form[key].view_index}`
																	: 'Select view index'}
															</span>
														</Select.Trigger>
														<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
															{#each [0, 1, 2] as index}
																<Select.Item
																	value={index.toString()}
																	label={`View ${index}`}
																	class="rounded-lg py-3 hover:bg-slate-50"
																>
																	View {index}
																</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												{/if}
											</div>
										{:else}
											<!-- PID Selection for High/Medium -->
											<div class="lg:col-span-2">
												{#if isDynamicRule($form[key])}
													<PIDSelect
														bind:pidValue={$form[key].pid}
														bind:unitValue={$form[key].units}
														{pids}
														disabled={$form[key].enable !== 'Enabled'}
														pidLabel="Parameter ID"
														unitLabel="Measurement Unit"
														class="space-y-4"
													/>
												{/if}
											</div>

											<!-- View Index Selection for High/Medium -->
											<div class="space-y-3 lg:col-span-2">
												<Label class="text-foreground text-sm font-semibold">View Index</Label>
												{#if isDynamicRule($form[key])}
													<Select.Root
														value={$form[key].view_index?.toString()}
														onValueChange={(value) =>
															($form[key].view_index = value ? Number(value) : undefined)}
														disabled={$form[key].enable !== 'Enabled'}
														type="single"
													>
														<Select.Trigger
															class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
																$form[key].enable === 'Enabled'
																	? `border-border bg-card hover:border-${priorities[i].color.split('-')[1]}-300 focus:border-${priorities[i].color.split('-')[1]}-400 focus:ring-2 focus:ring-${priorities[i].color.split('-')[1]}-100`
																	: 'border-border bg-muted'
															}`}
														>
															<span
																class={$form[key].view_index !== undefined
																	? 'text-foreground'
																	: 'text-muted-foreground'}
															>
																{$form[key].view_index !== undefined
																	? `View ${$form[key].view_index}`
																	: 'Select view index'}
															</span>
														</Select.Trigger>
														<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
															{#each [0, 1, 2] as index}
																<Select.Item
																	value={index.toString()}
																	label={`View ${index}`}
																	class={`rounded-lg py-3 hover:bg-${priorities[i].color.split('-')[1]}-50`}
																>
																	View {index}
																</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												{/if}
											</div>
										{/if}

										{#if priorities[i].name !== 'Default'}
											<!-- Comparison Operator -->
											<div class="space-y-3">
												<Label class="text-foreground text-sm font-semibold"
													>Comparison Operator</Label
												>
												{#if isDynamicRule($form[key])}
													<Select.Root
														bind:value={$form[key].compare}
														disabled={$form[key].enable !== 'Enabled'}
														type="single"
													>
														<Select.Trigger
															class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
																$form[key].enable === 'Enabled'
																	? `border-border bg-card hover:border-${priorities[i].color.split('-')[1]}-300 focus:border-${priorities[i].color.split('-')[1]}-400 focus:ring-2 focus:ring-${priorities[i].color.split('-')[1]}-100`
																	: 'border-border bg-muted'
															}`}
														>
															<span
																class={$form[key].compare
																	? 'text-foreground'
																	: 'text-muted-foreground'}
															>
																{$form[key].compare || 'Select operator'}
															</span>
														</Select.Trigger>
														<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
															{#each compareOps as op (op)}
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
												{/if}
											</div>

											<!-- Threshold Value -->
											<div class="space-y-3">
												<Label class="text-foreground text-sm font-semibold">Threshold Value</Label>
												{#if isDynamicRule($form[key])}
													<Input
														type="number"
														bind:value={$form[key].threshold}
														class={`h-12 rounded-xl border-2 transition-all duration-200 ${
															$form[key].enable === 'Enabled'
																? `border-border bg-card hover:border-${priorities[i].color.split('-')[1]}-300 focus:border-${priorities[i].color.split('-')[1]}-400 focus:ring-2 focus:ring-${priorities[i].color.split('-')[1]}-100`
																: 'border-border bg-muted'
														}`}
														disabled={$form[key].enable !== 'Enabled'}
														placeholder="Enter threshold value"
													/>
												{/if}
											</div>
										{/if}
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
			class="border-border mt-8 flex flex-col items-center justify-between gap-4 pt-6 md:flex-row"
		>
			<div class="text-muted-foreground flex items-center gap-4 text-sm">
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4" />
					<span
						>{Object.values($form).filter(
							(rule) => isDynamicRule(rule) && rule.enable === 'Enabled'
						).length} of 3 rules active</span
					>
				</div>
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
					Save Dynamic Rules
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
