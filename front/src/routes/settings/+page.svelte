<script lang="ts">
	import { Wrench, Save, Loader, Info } from 'lucide-svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import PageCard from '@/components/PageCard.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { updateConfig } from '$lib/utils/updateConfig';
	import { handleError, withRetry } from '$lib/utils/errorHandling';
	import toast from 'svelte-5-french-toast';

	let { data } = $props();

	const hasGeneralSettings = $derived(data.form.data.general && data.form.data.general.length > 0);
	const generalSettings = $derived(hasGeneralSettings ? data?.form?.data?.general?.[0] : null);
	const settingsUnavailable = $derived(!hasGeneralSettings);

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DigitalDashSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel();

			if (!hasGeneralSettings) {
				toast.error('Settings are not available. Please update your firmware.');
				return;
			}

			try {
				await withRetry(
					async () => {
						const result = await updateConfig((config) => {
							// Update general settings
							if (config.general && config.general.length > 0) {
								config.general[0].Splash = formData.data.general![0].Splash;
							}
						});

						if (!result.success) {
							throw new Error('Failed to save settings to device');
						}

						toast.success('Settings saved successfully!');
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
					context: 'Saving settings',
					fallbackMessage: 'Failed to save settings'
				});
			}
		}
	});
</script>

<form method="POST" use:enhance>
	<PageCard
		title="Settings"
		description="Configure your Digital Dash system preferences and options."
		icon={Wrench}
	>
		<div class="space-y-6">
			{#if settingsUnavailable}
				<div
					class="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
				>
					<div class="flex items-start gap-3">
						<Info class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
						<div>
							<h4 class="font-medium text-yellow-800 dark:text-yellow-200">Settings Unavailable</h4>
							<p class="text-muted-foreground mt-1 text-sm">
								General settings are not available in your current firmware version. Please update
								your Digital Dash firmware to access these settings.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-3 {settingsUnavailable ? 'opacity-50' : ''}">
				<Label class="text-foreground text-sm font-semibold">Firmware Version</Label>
				<Input
					type="number"
					value={generalSettings?.EE_Version ?? 0}
					disabled
					class="border-border bg-muted h-12 cursor-not-allowed rounded-xl border-2 transition-all duration-200"
					placeholder="Not available"
				/>
			</div>

			<div class="space-y-3 {settingsUnavailable ? 'opacity-50' : ''}">
				<Label for="splash" class="text-foreground text-sm font-semibold"
					>Splash Screen Duration</Label
				>
				{#if hasGeneralSettings}
					<Input
						id="splash"
						type="number"
						bind:value={$form.general[0].Splash}
						disabled={settingsUnavailable}
						class="border-border bg-card disabled:bg-muted h-12 rounded-xl border-2 transition-all duration-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Enter splash screen duration"
						min="0"
					/>
				{:else}
					<Input
						id="splash"
						type="number"
						value={0}
						disabled
						class="border-border bg-muted h-12 cursor-not-allowed rounded-xl border-2 opacity-50 transition-all duration-200"
						placeholder="Not available"
					/>
				{/if}
				<p class="text-muted-foreground text-xs">
					Set how long the splash screen displays (in seconds). Use 0 for an instant startup
				</p>
			</div>
		</div>

		{#snippet footerContent()}
			<div
				class="border-border flex w-full flex-col items-center justify-between gap-4 py-4 md:flex-row"
			>
				<div class="text-muted-foreground text-sm">
					{#if settingsUnavailable}
						Update your Digital Dash firmware to access additional settings.
					{:else}
						Configure your device settings and preferences
					{/if}
				</div>
				<Button
					type="submit"
					disabled={$submitting || settingsUnavailable}
					class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if $submitting}
						<Loader class="h-4 w-4 animate-spin" />
						Saving...
					{:else}
						<Save class="h-4 w-4" />
						Save Settings
					{/if}
				</Button>
			</div>
		{/snippet}
	</PageCard>
</form>
