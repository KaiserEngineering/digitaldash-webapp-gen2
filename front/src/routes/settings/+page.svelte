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
					class="rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4"
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

			{#if false}
				<div class="space-y-2">
					<Label class="text-foreground text-sm font-semibold">
						EEPROM Version:
						<span class="font-normal">
							{generalSettings?.EE_Version ?? 'Not available'}
						</span>
					</Label>
				</div>
				<hr />
			{/if}

			<div class="space-y-2 {!hasField(generalSettings, 'splash') ? 'opacity-50' : ''}">
				<Label for="splash" class="text-foreground text-sm font-semibold"
					>Splash Screen Duration</Label
				>
				<p class="text-muted-foreground text-xs">
					Set the splash screen display duration (in seconds). Use 0 to skip the splash screen and
					start immediately.
				</p>
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
			</div>
			<hr />

			<div class="space-y-2 {!hasField(generalSettings, 'can_bus_mode') ? 'opacity-50' : ''}">
				<Label for="can_bus_mode" class="text-foreground text-sm font-semibold">CAN Bus Mode</Label>
				<p class="text-muted-foreground text-xs">
					Normal Mode provides full communication; Listen-Only Mode passively monitors the bus for
					emissions testing, external OBD-II devices, or tuning.
				</p>
				{#if hasField(generalSettings, 'can_bus_mode') && $form.general && $form.general[0] && data.options.can_bus_mode}
					<Select.Root bind:value={$form.general[0].can_bus_mode} type="single">
						<Select.Trigger
							class="border-border bg-card hover:border-primary-200 focus:border-primary-200 focus:border-primary-200 h-12 rounded-xl border-2 transition-all duration-200 focus:ring-2"
						>
							<span
								class={$form.general[0].can_bus_mode ? 'text-foreground' : 'text-muted-foreground'}
							>
								{$form.general[0].can_bus_mode || 'Select CAN Bus Mode'}
							</span>
						</Select.Trigger>
						<Select.Content class="border-border rounded-xl border-2 shadow-xl">
							{#each data.options.can_bus_mode as mode}
								<Select.Item
									value={mode}
									label={mode}
									class="hover:border-primary-200 rounded-lg py-3"
								>
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
			</div>
		</div>

		{#snippet footerContent()}
			<div
				class="border-border flex w-full flex-col items-center justify-between gap-4 py-4 md:flex-row"
			>
				<div class="text-muted-foreground text-sm">
					{#if settingsUnavailable}
						Update your Digital Dash firmware to access additional settings.
					{:else}{/if}
				</div>
				<Button
					type="submit"
					disabled={$submitting || settingsUnavailable}
					variant="primary"
					class="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold shadow-lg transition-all duration-200 sm:w-auto sm:min-w-[200px]"
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
	<PageCard
		title="Configuration Backup"
		description="Export your complete dashboard configuration to save as a backup or share with others.
					Import previously saved configurations to quickly restore your settings."
		icon={Wrench}
	>
		<div class="flex flex-col gap-3 sm:flex-row">
			<Button
				type="button"
				onclick={handleExport}
				variant="primary"
				class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold shadow-lg transition-all duration-200"
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
				variant="outline"
				class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition-all duration-200"
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

		<div class="bg-muted border-border rounded-xl border p-4">
			<div class="flex items-start gap-2">
				<Info class="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
				<p class="text-muted-foreground text-xs">
					<strong class="text-foreground">Note:</strong> Importing a configuration will overwrite your
					current settings. Make sure to export your current configuration first if you want to keep it.
				</p>
			</div>
		</div>
	</PageCard>
</form>
