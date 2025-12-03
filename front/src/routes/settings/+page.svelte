<script lang="ts">
	import { Wrench, Save, Loader, Info, Download, Upload, FileBracesCorner } from 'lucide-svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import * as Select from '@/components/ui/select/index.js';
	import PageCard from '@/components/PageCard.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { DigitalDashSchema } from '$schemas/digitaldash';
	import { updateConfig } from '$lib/utils/updateConfig';
	import { handleError, withRetry } from '$lib/utils/errorHandling';
	import toast from 'svelte-5-french-toast';
	import { hasField, handleExport, handleImport } from './Settings';

	let { data } = $props();

	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod4(DigitalDashSchema),
		onUpdate: async ({ form: formData, cancel }) => {
			cancel();

			const hasGeneralSettings = formData.data.general && formData.data.general.length > 0;
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
								// Update only fields that exist in the form data
								if ('splash' in formData.data.general![0]) {
									config.general[0].splash = formData.data.general![0].splash;
								}
								if ('can_bus_mode' in formData.data.general![0]) {
									config.general[0].can_bus_mode = formData.data.general![0].can_bus_mode;
								}
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

	const hasGeneralSettings = $derived(($form.general?.length ?? 0) > 0);
	const generalSettings = $derived($form.general?.[0] ?? null);
	const settingsUnavailable = $derived(!hasGeneralSettings);

	let fileInput: HTMLInputElement;
	let isImporting = $state(false);

	/**
	 * Wrapper for handleImport to update form data
	 */
	async function onImportFile(event: Event) {
		await handleImport(
			event,
			(importedConfig) => {
				// Update form data
				$form.general = importedConfig.general || [];
			},
			(value) => {
				isImporting = value;
			}
		);
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
						<Info class="h-5 w-5" />
						<div>
							<h4 class="text font-medium">Settings Unavailable</h4>
							<p class="text-muted-foreground mt-1 text-sm">
								General settings are not available in your current firmware version. Please update
								your Digital Dash firmware to access these settings.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Configuration Backup/Restore Section -->
			<div class="border-border bg-card space-y-4 rounded-xl border-2 p-6">
				<div class="flex items-center gap-2">
					<FileBracesCorner class="text-primary h-5 w-5" />
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
						onchange={onImportFile}
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
					class="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-yellow-800 dark:bg-yellow-900/20"
				>
					<div class="flex items-start gap-2">
						<Info class="mt-0.5 h-4 w-4 flex-shrink-0" />
						<p class="text-xs">
							<strong>Note:</strong> Importing a configuration will overwrite your current settings.
							Make sure to export your current configuration first if you want to keep it.
						</p>
					</div>
				</div>
			</div>

			<div class="space-y-3 {!hasField(generalSettings, 'EE_Version') ? 'opacity-50' : ''}">
				<Label class="text-foreground text-sm font-semibold">Firmware Version</Label>
				<Input
					type="number"
					value={generalSettings?.EE_Version ?? 0}
					disabled
					class="border-border bg-muted h-12 cursor-not-allowed rounded-xl border-2 transition-all duration-200"
					placeholder="Not available"
				/>
			</div>

			<div class="space-y-3 {!hasField(generalSettings, 'splash') ? 'opacity-50' : ''}">
				<Label for="splash" class="text-foreground text-sm font-semibold"
					>Splash Screen Duration</Label
				>
				{#if hasField(generalSettings, 'splash') && $form.general && $form.general[0]}
					<Input
						id="splash"
						type="number"
						bind:value={$form.general[0].splash}
						disabled={!hasField(generalSettings, 'splash')}
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

			<div class="space-y-3">
				<Label for="can_bus_mode" class="text-foreground text-sm font-semibold">CAN Bus Mode</Label>
				{#if hasField(generalSettings, 'can_bus_mode') && $form.general && $form.general[0] && data.options.can_bus_mode}
					<Select.Root bind:value={$form.general[0].can_bus_mode} type="single">
						<Select.Trigger
							class="border-border bg-card h-12 rounded-xl border-2 transition-all duration-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
						>
							<span
								class={$form.general[0].can_bus_mode ? 'text-foreground' : 'text-muted-foreground'}
							>
								{$form.general[0].can_bus_mode || 'Select CAN Bus Mode'}
							</span>
						</Select.Trigger>
						<Select.Content class="border-border rounded-xl border-2 shadow-xl">
							{#each data.options.can_bus_mode as mode}
								<Select.Item value={mode} label={mode} class="rounded-lg py-3 hover:bg-emerald-50">
									{mode}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{:else}
					<Select.Root type="single" disabled>
						<Select.Trigger
							class="border-border bg-muted h-12 cursor-not-allowed rounded-xl border-2 opacity-50 transition-all duration-200"
						>
							<span class="text-muted-foreground">Not available</span>
						</Select.Trigger>
					</Select.Root>
				{/if}
				<p class="text-muted-foreground text-xs">
					Configure the CAN bus operation mode (Normal Mode for full communication, Listen Only for
					monitoring)
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
