<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-5-french-toast';
	import { ViewSchema } from '$schemas/digitaldash';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { Button } from '@/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Settings as SettingsIcon, Gauge, Save } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Gauges from './tabs/Gauges.svelte';
	import Settings from './tabs/Settings.svelte';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import ViewCard from '@/components/ViewCard.svelte';
	import PageCard from '@/components/PageCard.svelte';

	let { data } = $props();
	const viewId = data.viewId;

	let isSubmitting = $state(false);

	const { form, enhance } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		invalidateAll: false, // Prevent SvelteKit from invalidating page data
		resetForm: false,
		validators: zod4(ViewSchema),
		onSubmit: async ({ cancel }) => {
			// Cancel the default form submission and handle manually
			cancel();

			isSubmitting = true;
			try {
				const result = await updateFullConfig((config) => {
					config.view[viewId] = { ...config.view[viewId], ...$form };
				});

				if (!result.success) {
					toast.error('Failed to save view settings. Please try again.');
				}
			} catch (error) {
				console.error('Failed to save view settings:', error);
				toast.error('Failed to save view settings. Please try again.');
			} finally {
				isSubmitting = false;
			}
		}
	});

	let activeTab: 'view' | 'gauges' = $state('view');

	let selectedBackground = $derived(
		data.backgrounds.find((f: string) => f.toLowerCase() === $form.background.toLowerCase()) ??
			'Select a background'
	);
</script>

<PageCard
	title="View edit"
	description="Edit your view settings and gauges."
	icon={SettingsIcon}
	{enhance}
>
	<Tabs.Root bind:value={activeTab} class="w-full">
		<ViewCard view={$form} index={viewId} pids={data.pids} />

		<Tabs.List class="grid h-10 w-full grid-cols-2">
			<Tabs.Trigger value="view" class="tab-trigger">
				<SettingsIcon />
				<span>Settings</span>
			</Tabs.Trigger>

			<Tabs.Trigger value="gauges" class="tab-trigger">
				<Gauge />
				<span>Gauges</span>
				<Badge variant="secondary" class="text-xs">
					{$form.num_gauges || 0}
				</Badge>
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="view">
			<Settings {form} backgrounds={data.backgrounds} {selectedBackground} />
		</Tabs.Content>

		<Tabs.Content value="gauges">
			<Gauges {selectedBackground} themes={data.themes} pids={data.pids} {form} />
		</Tabs.Content>
	</Tabs.Root>

	{#snippet footerContent()}
		<div class="border-border bg-muted/30 py-4">
			<div class="flex items-center justify-between">
				<Button
					type="submit"
					class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-gray-800"
						></div>
						Saving...
					{:else}
						<Save class="h-4 w-4" />
						Save Changes
					{/if}
				</Button>
			</div>
		</div>
	{/snippet}
</PageCard>
