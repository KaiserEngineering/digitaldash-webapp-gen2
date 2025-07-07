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
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateFullConfig } from '@/config/updateConfig';
	import PageCard from '@/components/PageCard.svelte';
	import { Switch } from '@/components/ui/switch';

	let { data } = $props();

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod(AlertsFormSchema),
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
							alert.enabled
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
							<div class="space-y-2">
								<Label>PID</Label>
								<div class="space-y-2">
									<select
										bind:value={alert.pid}
										disabled={!alert.enabled}
										class="w-full rounded-md border px-3 py-2 text-sm"
									>
										{#each data.pids as pid}
											<option value={pid.label}>{pid.label}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="space-y-2">
								<Label>Message</Label>
								<Input
									type="text"
									bind:value={alert.message}
									class="w-full"
									disabled={!alert.enabled}
								/>
							</div>

							<div class="space-y-2">
								<Label>Threshold</Label>
								<Input
									type="number"
									bind:value={alert.threshold}
									class="w-full"
									disabled={!alert.enabled}
								/>
							</div>

							<div class="flex items-center gap-2">
								<Switch bind:checked={alert.enabled} />
								<Label>Enabled</Label>
							</div>
						</div>
					</div>
				</Motion.div>
			</div>
		{/each}
	{/snippet}

	{#snippet footerContent()}
		<div class="mb-6 mt-4 flex flex-col items-center justify-between gap-4 md:flex-row">
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
