<script lang="ts">
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { toast } from 'svelte-5-french-toast';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Loader2, Save, FileText } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { updateFullConfig } from '@/config/updateConfig.js';
	import PageCard from '@/components/PageCard.svelte';

	let { data } = $props();

	let configJson = $state(JSON.stringify(data.form, null, 2));

	const { enhance, submitting, message } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod(DigitalDashSchema),
		onSubmit: async () => {
			try {
				const parsedConfig = JSON.parse(configJson);
				const success = await updateFullConfig((config) => {
					config = parsedConfig;
				}, 'Config saved!');

				if (!success) {
					toast.error('Failed to save config');
				}
			} catch (e) {
				toast.error('Invalid JSON');
				return false;
			}
		}
	});
</script>

<PageCard title="Advanced edit" description="Edit your view full config." icon={FileText} {enhance}>
	{#snippet children()}
		<div class="space-y-2">
			<label for="config-json" class="text-sm font-medium">Configuration JSON</label>
			<Textarea
				id="config-json"
				rows={20}
				bind:value={configJson}
				class="bg-muted/50 min-h-[400px] w-full resize-y font-mono text-sm"
			/>
		</div>

		{#if $message}
			<Alert variant="destructive">
				<AlertDescription class="font-mono text-xs whitespace-pre-wrap">
					{$message}
				</AlertDescription>
			</Alert>
		{/if}
	{/snippet}

	{#snippet footerContent()}
		<Button type="submit" disabled={$submitting} class="flex items-center gap-2">
			{#if $submitting}
				<Loader2 class="h-4 w-4 animate-spin" />
				Saving…
			{:else}
				<Save class="h-4 w-4" />
				Save Config
			{/if}
		</Button>
	{/snippet}
</PageCard>
