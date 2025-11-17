<script lang="ts">
	import { Wrench, Save, Loader, Info, Download, Upload, FileJson } from 'lucide-svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import PageCard from '@/components/PageCard.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { updateConfig } from '$lib/utils/updateConfig';
	import { handleError, withRetry } from '$lib/utils/errorHandling';
	import { exportConfig, importConfig } from '$lib/utils/configBackup';
	import { configStore } from '$lib/stores/configStore';
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

	let fileInput: HTMLInputElement;
	let isImporting = $state(false);

	/**
	 * Handle export configuration
	 */
	function handleExport() {
		const config = configStore.getValue();
		if (!config) {
			toast.error('No configuration loaded to export');
			return;
		}

		try {
			exportConfig(config);
			toast.success('Configuration exported successfully!');
		} catch (e) {
			handleError(e, {
				context: 'Exporting configuration',
				fallbackMessage: 'Failed to export configuration'
			});
		}
	}

	/**
	 * Handle import configuration
	 */
	async function handleImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		isImporting = true;

		try {
			const importedConfig = await importConfig(file);

			// Save imported configuration to device
			await withRetry(
				async () => {
					const response = await fetch('/api/config', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(importedConfig)
					});

					if (!response.ok) {
						throw new Error('Failed to save imported configuration to device');
					}

					// Update local store
					configStore.setConfig(importedConfig);

					// Update form data
					$form.general = importedConfig.general || [];

					toast.success('Configuration imported and saved successfully!');
				},
				{
					maxRetries: 2,
					delay: 1000
				}
			);
		} catch (e) {
			handleError(e, {
				context: 'Importing configuration',
				fallbackMessage: 'Failed to import configuration'
			});
		} finally {
			isImporting = false;
			// Reset file input
			input.value = '';
		}
	}

	/**
	 * Trigger file input click
	 */
	function triggerFileInput() {
		fileInput?.click();
	}
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

			<!-- Configuration Backup/Restore Section -->
			<div class="border-border bg-card/50 space-y-4 rounded-xl border-2 p-6">
				<div class="flex items-center gap-2">
					<FileJson class="text-primary h-5 w-5" />
					<h3 class="text-foreground text-lg font-semibold">Configuration Backup</h3>
				</div>
				<p class="text-muted-foreground text-sm">
					Export your complete dashboard configuration to save as a backup or share with others.
					Import previously saved configurations to quickly restore your settings.
				</p>

				<div class="flex flex-col gap-3 sm:flex-row">
					<Button
						type="button"
						onclick={handleExport}
						class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 font-semibold text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900"
					>
						<Download class="h-4 w-4" />
						Export Configuration
					</Button>

					<input
						type="file"
						accept=".json"
						bind:this={fileInput}
						onchange={handleImport}
						class="hidden"
					/>

					<Button
						type="button"
						onclick={triggerFileInput}
						disabled={isImporting}
						class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 font-semibold text-blue-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:border-blue-700 dark:hover:bg-blue-900"
					>
						{#if isImporting}
							<Loader class="h-4 w-4 animate-spin" />
							Importing...
						{:else}
							<Upload class="h-4 w-4" />
							Import Configuration
						{/if}
					</Button>
				</div>

				<div
					class="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20"
				>
					<p class="text-xs text-orange-800 dark:text-orange-200">
						<strong>Note:</strong> Importing a configuration will overwrite your current settings. Make
						sure to export your current configuration first if you want to keep it.
					</p>
				</div>
			</div>

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
