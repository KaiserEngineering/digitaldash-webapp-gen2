<script lang="ts">
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader2, Save, FileText, CheckCircle, AlertTriangle } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import { handleError, withRetry } from '$lib/utils/errorHandling';
	import PageCard from '@/components/PageCard.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	let { data } = $props();

	let configJson = $state(JSON.stringify(data.form, null, 2));
	let jsonError = $state<string | null>(null);
	let validationError = $state<string | null>(null);
	let isValidJson = $state(true);

	// Real-time JSON validation
	$effect(() => {
		try {
			const parsed = JSON.parse(configJson);
			jsonError = null;
			isValidJson = true;

			// Validate against schema
			const result = DigitalDashSchema.safeParse(parsed);
			if (!result.success) {
				const errors = result.error.errors
					.map((e) => `${e.path.join('.')}: ${e.message}`)
					.join(', ');
				validationError = `Schema validation failed: ${errors}`;
			} else {
				validationError = null;
			}
		} catch (e) {
			jsonError = e instanceof Error ? e.message : 'Invalid JSON syntax';
			isValidJson = false;
			validationError = null;
		}
	});

	const { enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DigitalDashSchema),
		onSubmit: async () => {
			if (!isValidJson || validationError) {
				handleError(new Error(jsonError || validationError || 'Invalid configuration'), {
					context: 'Configuration validation'
				});
				return false;
			}

			try {
				const parsedConfig = JSON.parse(configJson);

				await withRetry(
					async () => {
						const success = await updateFullConfig((config) => {
							return parsedConfig;
						}, 'Configuration saved successfully!');

						if (!success) {
							throw new Error('Failed to save configuration to device');
						}
					},
					{
						maxRetries: 2,
						delay: 1000,
						onRetry: (attempt) => {
							console.log(`Retrying save operation, attempt ${attempt}`);
						}
					}
				);
			} catch (e) {
				handleError(e, {
					context: 'Saving configuration',
					fallbackMessage: 'Failed to save configuration'
				});
				return false;
			}
		}
	});

	function formatJson() {
		try {
			const parsed = JSON.parse(configJson);
			configJson = JSON.stringify(parsed, null, 2);
		} catch (e) {
			handleError(e, {
				context: 'JSON formatting',
				showToast: true
			});
		}
	}

	function resetConfig() {
		configJson = JSON.stringify(data.form, null, 2);
	}
</script>

<PageCard title="Advanced edit" description="Edit your view full config." icon={FileText} {enhance}>
	{#snippet children()}
		<div class="space-y-4">
			<!-- Real-time validation status -->
			<div class="flex items-center justify-between">
				<label for="config-json" class="text-sm font-medium">Configuration JSON</label>
				<div class="flex items-center gap-2">
					{#if isValidJson && !validationError}
						<div class="flex items-center gap-1 text-green-600">
							<CheckCircle class="h-4 w-4" />
							<span class="text-xs">Valid</span>
						</div>
					{:else}
						<div class="flex items-center gap-1 text-red-600">
							<AlertTriangle class="h-4 w-4" />
							<span class="text-xs">Invalid</span>
						</div>
					{/if}
				</div>
			</div>

			<Textarea
				id="config-json"
				rows={20}
				bind:value={configJson}
				class="bg-muted/50 min-h-[400px] w-full resize-y font-mono text-sm {jsonError
					? 'border-red-300 focus:border-red-500'
					: validationError
						? 'border-yellow-300 focus:border-yellow-500'
						: 'border-green-300 focus:border-green-500'}"
			/>

			<!-- Error display -->
			{#if jsonError}
				<ErrorBoundary
					error={jsonError}
					title="JSON Syntax Error"
					variant="error"
					showRetry={false}
					showHome={false}
				/>
			{:else if validationError}
				<ErrorBoundary
					error={validationError}
					title="Configuration Validation Error"
					variant="warning"
					showRetry={false}
					showHome={false}
				/>
			{/if}

			<!-- Action buttons -->
			<div class="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onclick={formatJson}
					disabled={!isValidJson}
					class="flex items-center gap-2"
				>
					<FileText class="h-4 w-4" />
					Format JSON
				</Button>
				<Button
					type="button"
					variant="outline"
					onclick={resetConfig}
					class="flex items-center gap-2"
				>
					Reset to Original
				</Button>
			</div>
		</div>
	{/snippet}

	{#snippet footerContent()}
		<Button
			type="submit"
			disabled={$submitting || !isValidJson || !!validationError}
			class="flex items-center gap-2"
		>
			{#if $submitting}
				<Loader2 class="h-4 w-4 animate-spin" />
				Saving Configuration...
			{:else}
				<Save class="h-4 w-4" />
				Save Configuration
			{/if}
		</Button>
	{/snippet}
</PageCard>
