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
		resetForm: false,
		validators: zod4(ViewSchema),
		onSubmit: async ({ cancel }) => {
			// Cancel the default form submission and handle manually
			cancel();

			isSubmitting = true;
			try {
				const success = await updateFullConfig((config) => {
					config.view[viewId] = { ...config.view[viewId], ...$form };
				}, 'View settings updated successfully!');

				if (!success) {
					toast.error('Failed to save view settings. Please try again.');
				}
			} finally {
				isSubmitting = false;
			}
		}
	});

	let activeTab: 'view' | 'gauges' = $state('view');
</script>

<PageCard
	title="View edit"
	description="Edit your view settings and gauges."
	icon={SettingsIcon}
	{enhance}
>
	{#snippet children()}
		<Tabs.Root bind:value={activeTab} class="w-full">
			<ViewCard view={$form} index={viewId} pids={data.pids} />

			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger
					value="view"
					class="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 flex items-center justify-center gap-2 rounded-md
				text-sm
				font-medium transition-all
				data-[state=active]:shadow-sm"
				>
					<SettingsIcon />
					<span>Settings</span>
				</Tabs.Trigger>

				<Tabs.Trigger
					value="gauges"
					class="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-background/50 flex items-center justify-center gap-2 rounded-md
				text-sm
				font-medium transition-all
				data-[state=active]:shadow-sm"
				>
					<Gauge />
					<span>Gauges</span>
					<Badge variant="secondary" class="text-xs">
						{$form.num_gauges || 0}
					</Badge>
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="view">
				<Settings {form} backgrounds={data.backgrounds} />
			</Tabs.Content>

			<Tabs.Content value="gauges">
				<Gauges themes={data.themes} pids={data.pids} {form} />
			</Tabs.Content>
		</Tabs.Root>
	{/snippet}

	{#snippet footerContent()}
		<div class="border-border bg-muted/30 border-t py-4">
			<div class="flex items-center justify-between">
				<Button type="submit" class="flex items-center gap-2" disabled={isSubmitting}>
					{#if isSubmitting}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
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
