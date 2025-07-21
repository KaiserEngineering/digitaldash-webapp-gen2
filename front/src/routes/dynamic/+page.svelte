<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { DigitalDashDynamic } from '$schemas/digitaldash';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Switch } from '@/components/ui/switch';
	import * as Select from '@/components/ui/select';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';
	import { Settings, ChevronDown } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { DynamicFormSchema } from './dynamicFormSchema';

	let { data } = $props();
	const pids = data.pids || [];
	const options = data.options || {};

	const { form, submitting, enhance, reset } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DynamicFormSchema),
		onUpdate: async ({ form }) => {
			try {
				const result = await updateFullConfig((config) => {
					config.dynamic = form.data.items as DigitalDashDynamic[];
				}, 'Dynamic rules saved!');

				if (result.success && result.config) {
					// Use SuperForm's reset method to properly update form state
					reset({ data: { items: result.config.dynamic } });
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

	// Fixed priorities for exactly 3 rules
	const priorities = ['High', 'Medium', 'Low'];
</script>

<PageCard title="Dynamic Rules" description="Define dynamic gauge rules." icon={Settings} {enhance}>
	{#snippet children()}
		{#each { length: 3 } as _, i (i)}
			<div
				in:slide={{ duration: 200, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 300 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<Collapsible.Root>
						<div
							class={`relative rounded-xl border transition duration-200 ${
								$form.items[i]?.enable === 'Enabled'
									? 'border-primary-100 bg-primary-50 hover:shadow-md'
									: 'border-gray-200 bg-gray-50 opacity-60'
							}`}
						>
							<!-- Touchable header that expands/collapses the card -->
							<Collapsible.Trigger class="w-full text-left">
								<div
									class="text-primary-700 hover:bg-primary-100/50 flex items-center justify-between border-b p-4 transition-colors"
								>
									<div class="flex items-center gap-3">
										<div
											class="bg-primary-100 flex h-10 w-10 p-2 items-center justify-center rounded-full text-xs font-semibold"
										>
											{priorities[i]}
										</div>
										<div class="text-left">
											<p class="text-xs text-gray-600">
												{$form.items[i]?.pid || 'No PID selected'}
												• {priorities[i]} Priority
												{#if $form.items[i]?.enable === 'Enabled'}• Enabled{:else}• Disabled{/if}
											</p>
										</div>
									</div>
									<ChevronDown
										class="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180"
									/>
								</div>
							</Collapsible.Trigger>

							<!-- Collapsible content -->
							<Collapsible.Content>
								<div class="grid grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-2">
									<PIDSelect
										bind:pidValue={$form.items[i].pid}
										bind:unitValue={$form.items[i].units}
										{pids}
										disabled={$form.items[i]?.enable !== 'Enabled'}
										pidLabel="PID"
										unitLabel="Unit"
										class="space-y-2"
										key={`rule-${i}`}
									/>

									<div class="space-y-2">
										<Label>Compare</Label>
										<Select.Root
											bind:value={$form.items[i].compare}
											disabled={$form.items[i]?.enable !== 'Enabled'}
											type="single"
										>
											<Select.Trigger class="h-10 w-full">
												<span>{$form.items[i]?.compare || 'Select Compare'}</span>
											</Select.Trigger>
											<Select.Content>
												{#each compareOps as op}
													<Select.Item value={op} label={op}>
														{op}
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<div class="space-y-2">
										<Label>Threshold</Label>
										<Input type="number" bind:value={$form.items[i].threshold} disabled={$form.items[i]?.enable !== 'Enabled'} />
									</div>

									<div class="space-y-2">
										<Label>Priority</Label>
										<div class="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
											<span class="font-medium text-gray-700">{priorities[i]}</span>
											<span class="ml-2 text-xs text-gray-500">(Fixed)</span>
										</div>
									</div>

									<div class="flex items-center gap-2">
										<Switch
											checked={$form.items[i]?.enable === 'Enabled'}
											onCheckedChange={(checked) =>
												($form.items[i].enable = checked ? 'Enabled' : 'Disabled')}
										/>
										<Label>Enabled</Label>
									</div>
								</div>
							</Collapsible.Content>
						</div>
					</Collapsible.Root>
				</Motion.div>
			</div>
		{/each}
	{/snippet}

	{#snippet footerContent()}
		<div class="mb-6 mt-4 flex items-center justify-between">
			<Button
				type="submit"
				disabled={$submitting}
				class="mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
			>
				{#if $submitting}
					Saving...
				{:else}
					Save Rules
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
