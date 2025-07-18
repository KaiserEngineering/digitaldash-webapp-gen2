<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { Bell } from 'lucide-svelte';
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
	import { Switch } from '@/components/ui/switch';
	import * as Select from '@/components/ui/select';

	let { data } = $props();
	const pids = data.pids || [];
	const compareOps = data.options?.alert_comparison || [];

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(AlertsFormSchema),
		onSubmit: async () => {
			const success = await updateFullConfig((config) => {
				config.alert = $form.items;
			}, 'Alerts saved!');

			if (!success) {
				toast.error('Failed to save alerts');
			}
		}
	});
</script>

<PageCard title="Alerts edit" description="Edit your view alerts." icon={Bell} {enhance}>
	{#snippet children()}
		{#each $form.items as alert, i (i)}
			<div
				in:slide={{ duration: 200, easing: quintOut }}
				out:slide={{ duration: 200, easing: quintOut }}
				animate:flip={{ duration: 300 }}
			>
				<Motion.div key={i} class="overflow-hidden">
					<div
						class={`relative rounded-xl border p-5 transition duration-200 ${
							alert.enable === 'Enabled'
								? 'border-primary-100 bg-primary-50 hover:-translate-y-1 hover:shadow-md'
								: 'border-gray-200 bg-gray-50 opacity-60'
						}`}
					>
						<div class="border-primary-100 text-primary-700 flex items-center gap-2 border-b pb-4">
							<div
								class="bg-primary-100 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
							>
								{i + 1}
							</div>
							<span class="font-semibold">Alert #{i + 1}</span>
						</div>

						<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
							<PIDSelect
								bind:pidValue={alert.pid}
								bind:unitValue={alert.units}
								{pids}
								disabled={alert.enable !== 'Enabled'}
								pidLabel="PID"
								unitLabel="Unit"
								class="space-y-2"
								key={`alert-${i}`}
							/>

							<div class="space-y-2">
								<Label>Compare</Label>
								<Select.Root
									bind:value={alert.compare}
									disabled={alert.enable !== 'Enabled'}
									type="single"
								>
									<Select.Trigger class="w-full h-10">
										<span>{alert.compare || 'Select Compare'}</span>
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
								<Label>Message</Label>
								<Input
									type="text"
									bind:value={alert.message}
									class="w-full"
									disabled={alert.enable !== 'Enabled'}
								/>
							</div>

							<div class="space-y-2">
								<Label>Threshold</Label>
								<Input
									type="number"
									bind:value={alert.threshold}
									class="w-full"
									disabled={alert.enable !== 'Enabled'}
								/>
							</div>

							<div class="flex items-center gap-2">
								<Switch
									checked={alert.enable === 'Enabled'}
									onCheckedChange={(checked) => (alert.enable = checked ? 'Enabled' : 'Disabled')}
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
		<div class="mt-4 mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
			<Button
				type="submit"
				disabled={$submitting}
				class="w-full rounded-lg px-4 py-2.5 text-sm font-semibold md:w-auto"
			>
				{#if $submitting}
					Saving...
				{:else}
					Save Alerts
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
