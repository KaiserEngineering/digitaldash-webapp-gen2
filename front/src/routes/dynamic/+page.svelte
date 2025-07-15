<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { DynamicFormSchema } from './dynamicFormSchema';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Switch } from '@/components/ui/switch';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import { Settings } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	let { data } = $props();
	const pids = data.pids || [];

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

	const compareOps = [
		{ label: 'Less Than', value: 'Less Than' },
		{ label: '≤', value: 'Less Than Or Equal To' },
		{ label: '>', value: 'Greater Than' },
		{ label: '≥', value: 'Greater Than Or Equal To' },
		{ label: '=', value: 'Equal' },
		{ label: '≠', value: 'Not Equal' }
	];

	const priorities = ['Low', 'Medium', 'High'];
</script>

<PageCard title="Dynamic Rules" description="Define dynamic gauge rules." icon={Settings} {enhance}>
	{#snippet children()}
		{#each $form.items as rule, i (i)}
			<div
				in:slide={{ duration: 200, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 300 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<div
						class={`relative rounded-xl border p-5 transition duration-200 ${
							rule.enabled
								? 'border-primary-100 bg-primary-50 hover:-translate-y-1 hover:shadow-md'
								: 'border-gray-200 bg-gray-50 opacity-60'
						}`}
					>
						<div class="text-primary-700 flex items-center gap-2 border-b pb-4">
							<div
								class="bg-primary-100 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
							>
								{i + 1}
							</div>
							<span class="font-semibold">Rule #{i + 1}</span>
						</div>

						<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label>PID</Label>
								<select
									bind:value={rule.pid}
									disabled={!rule.enabled}
									class="w-full rounded-md border px-3 py-2 text-sm"
								>
									{#each pids as pid}
										<option value={pid.label}>{pid.label}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label>Compare</Label>
								<select
									bind:value={rule.compare}
									disabled={!rule.enabled}
									class="w-full rounded-md border px-3 py-2 text-sm"
								>
									{#each compareOps as op}
										<option value={op.value}>{op.label}</option>
									{/each}
								</select>
							</div>

							<div class="space-y-2">
								<Label>Threshold</Label>
								<Input type="number" bind:value={rule.threshold} disabled={!rule.enabled} />
							</div>

							<div class="space-y-2">
								<Label>Priority</Label>
								<select
									bind:value={rule.priority}
									disabled={!rule.enabled}
									class="w-full rounded-md border px-3 py-2 text-sm"
								>
									{#each priorities as p}
										<option value={p}>{p}</option>
									{/each}
								</select>
							</div>

							<div class="flex items-center gap-2">
								<Switch bind:checked={rule.enabled} />
								<Label>Enabled</Label>
							</div>
						</div>
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
