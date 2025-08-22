<script lang="ts">
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Loader, Save, FileText, CircleCheck, TriangleAlert } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { updateConfig as updateFullConfig } from '$lib/utils/updateConfig';
	import { handleError, withRetry } from '$lib/utils/errorHandling';
	import PageCard from '@/components/PageCard.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	let { data } = $props();

	let configJson = $state(JSON.stringify(data.form.data, null, 2));

	// Real-time JSON validation using derived state
	const validationResult = $derived.by(() => {
		try {
			const parsed = JSON.parse(configJson);

			// Validate against schema
			const result = DigitalDashSchema.safeParse(parsed);

			if (!result.success) {
				const errors = result.error.issues
					.map((e) => `${e.path.join('.')}: ${e.message} (received: ${JSON.stringify(e.received)})`)
					.join('\n');

				return {
					jsonError: null,
					isValidJson: true,
					validationError: `Schema validation failed:\n${errors}`
				};
			} else {
				return {
					jsonError: null,
					isValidJson: true,
					validationError: null
				};
			}
		} catch (e) {
			return {
				jsonError: e instanceof Error ? e.message : 'Invalid JSON syntax',
				isValidJson: false,
				validationError: null
			};
		}
	});

	const jsonError = $derived(validationResult.jsonError);
	const isValidJson = $derived(validationResult.isValidJson);
	const validationError = $derived(validationResult.validationError);

	const { enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DigitalDashSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel(); // Cancel the default form submission

			if (!isValidJson || validationError) {
				handleError(new Error(jsonError || validationError || 'Invalid configuration'), {
					context: 'Configuration validation'
				});
				return;
			}

			try {
				const parsedConfig = JSON.parse(configJson);

				await withRetry(
					async () => {
						const success = await updateFullConfig(() => {
							return parsedConfig;
						}, 'Configuration saved successfully!');

						if (!success) {
							throw new Error('Failed to save configuration to device');
						}
					},
					{
						maxRetries: 2,
						delay: 1000,
						onRetry: () => {
							// Retry attempt
						}
					}
				);
			} catch (e) {
				handleError(e, {
					context: 'Saving configuration',
					fallbackMessage: 'Failed to save configuration'
				});
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
		configJson = JSON.stringify(data.form.data, null, 2);
	}
</script>

<PageCard title="Advanced edit" description="Edit your view full config." icon={FileText} {enhance}>
	<div class="space-y-4">
		<!-- Real-time validation status -->
		<div class="flex items-center justify-between">
			<label for="config-json" class="text-sm font-medium">Configuration JSON</label>
			<div class="flex items-center gap-2">
				{#if isValidJson && !validationError}
					<div class="flex items-center gap-1 text-green-600">
						<CircleCheck class="h-4 w-4" />
						<span class="text-xs">Valid</span>
					</div>
				{:else}
					<div class="flex items-center gap-1 text-red-600">
						<TriangleAlert class="h-4 w-4" />
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
			<div
				class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
			>
				<h4 class="font-medium text-yellow-800 dark:text-yellow-200">
					Configuration Validation Error
				</h4>
				<pre
					class="mt-2 font-mono text-xs whitespace-pre-wrap text-yellow-700 dark:text-yellow-300">{validationError}</pre>
			</div>
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
			<Button type="button" variant="outline" onclick={resetConfig} class="flex items-center gap-2">
				Reset to Original
			</Button>
		</div>
	</div>

	{#snippet footerContent()}
		<Button
			type="submit"
			disabled={$submitting || !isValidJson || !!validationError}
			class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200"
		>
			{#if $submitting}
				<Loader class="h-4 w-4 animate-spin" />
				Saving Configuration...
			{:else}
				<Save class="h-4 w-4" />
				Save Configuration
			{/if}
		</Button>
	{/snippet}
</PageCard>
