<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { DynamicFormSchema } from './dynamicFormSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Switch } from '@/components/ui/switch';
	import * as Select from '@/components/ui/select';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';
	import { Settings, ChevronDown } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	let { data } = $props();
	const pids = data.pids || [];
	const options = data.options || {};

	// Track which rule cards are expanded (independent expand/collapse)
	let expandedRules = $state<Set<number>>(new Set());

	// Toggle expanded state for a rule card
	function toggleRuleExpand(index: number) {
		const newExpanded = new Set(expandedRules);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		expandedRules = newExpanded;
	}

	const { form, submitting, enhance } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DynamicFormSchema),
		onSubmit: async () => {
			const success = await updateFullConfig((config) => {
				config.dynamic = $form.items;
			}, 'Dynamic rules saved!');

			if (!success) {
				toast.error('Failed to save dynamic rules. Please try again.');
			}
		}
	});

	const compareOps = options.dynamic_comparison || [];

	const priorities = ['Low', 'Medium', 'High'];
</script>

<PageCard title="Dynamic Rules" description="Define dynamic gauge rules." icon={Settings} {enhance}>
	{#snippet children()}
		{#each $form.items as rule, i (rule.index ?? i)}
			{@const isExpanded = expandedRules.has(i)}
			<div
				in:slide={{ duration: 200, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 300 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<div
						class={`relative rounded-xl border transition duration-200 ${
							rule.enable === 'Enabled'
								? 'border-primary-100 bg-primary-50 hover:shadow-md'
								: 'border-gray-200 bg-gray-50 opacity-60'
						}`}
					>
						<!-- Touchable header that expands/collapses the card -->
						<button
							type="button"
							class="w-full text-left"
							onclick={() => toggleRuleExpand(i)}
							aria-expanded={isExpanded}
						>
							<div class="text-primary-700 flex items-center justify-between border-b p-4">
								<div class="flex items-center gap-3">
									<div
										class="bg-primary-100 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
									>
										{i + 1}
									</div>
									<div>
										<h4 class="font-semibold">Rule #{i + 1}</h4>
										<p class="text-xs text-gray-600">
											{rule.pid || 'No PID selected'}
											{#if rule.priority}• {rule.priority}{/if}
											{#if rule.enable === 'Enabled'}• Enabled{:else}• Disabled{/if}
										</p>
									</div>
								</div>
								<ChevronDown
									class="h-5 w-5 transition-transform duration-200"
									style={isExpanded ? 'transform: rotate(180deg)' : ''}
								/>
							</div>
						</button>

						<!-- Card content that shows/hides based on expanded state -->
						{#if isExpanded}
							<div 
								class="grid grid-cols-1 gap-4 p-4 pt-0 md:grid-cols-2"
								in:slide={{ duration: 300, easing: quintOut }}
								out:slide={{ duration: 200, easing: quintOut }}
							>
							<PIDSelect
								bind:pidValue={rule.pid}
								bind:unitValue={rule.units}
								{pids}
								disabled={rule.enable !== 'Enabled'}
								pidLabel="PID"
								unitLabel="Unit"
								class="space-y-2"
								key={`rule-${i}`}
							/>

							<div class="space-y-2">
								<Label>Compare</Label>
								<Select.Root
									bind:value={rule.compare}
									disabled={rule.enable !== 'Enabled'}
									type="single"
								>
									<Select.Trigger class="w-full h-10">
										<span>{rule.compare || 'Select Compare'}</span>
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
								<Input type="number" bind:value={rule.threshold} disabled={!rule.enable} />
							</div>

							<div class="space-y-2">
								<Label>Priority</Label>
								<Select.Root
									bind:value={rule.priority}
									disabled={rule.enable !== 'Enabled'}
									type="single"
								>
									<Select.Trigger class="w-full h-10">
										<span>{rule.priority || 'Select Priority'}</span>
									</Select.Trigger>
									<Select.Content>
										{#each priorities as p}
											<Select.Item value={p} label={p}>
												{p}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

								<div class="flex items-center gap-2">
									<Switch
										checked={rule.enable === 'Enabled'}
										onCheckedChange={(checked) => (rule.enable = checked ? 'Enabled' : 'Disabled')}
									/>
									<Label>Enabled</Label>
								</div>
							</div>
						{/if}
					</div>
				</Motion.div>
			</div>
		{/each}
	{/snippet}

	{#snippet footerContent()}
		<div class="mt-4 mb-6 flex items-center justify-between">
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
