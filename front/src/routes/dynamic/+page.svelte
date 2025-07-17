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
	import { Settings } from 'lucide-svelte';
	import { Motion } from 'motion-start';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	let { data } = $props();
	const pids = data.pids || [];
	const options = data.options || [];

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
		{#each $form.items as rule, i (i)}
			<div
				in:slide={{ duration: 200, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 300 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<div
						class={`relative rounded-xl border p-5 transition duration-200 ${
							rule.enable === 'Enabled'
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
								<Select.Root
									bind:value={rule.pid}
									disabled={rule.enable !== 'Enabled'}
									type="single"
								>
									<Select.Trigger class="w-full h-10">
										<span>{rule.pid || 'Select PID'}</span>
									</Select.Trigger>
									<Select.Content>
										{#each pids as pid}
											<Select.Item value={pid.label} label={pid.label}>
												{pid.label}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>

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
