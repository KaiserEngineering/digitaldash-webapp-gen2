<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { toast } from 'svelte-5-french-toast';
	import { SingleViewEditSchema } from '$schemas/digitaldash';
	import { AnimatePresence, Motion } from 'motion-start';

	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Settings, Gauge, Bell, Save, Plus, Trash2, ChevronRight } from 'lucide-svelte';
	import { zod } from 'sveltekit-superforms/adapters';
	import * as Select from '@/components/ui/select';

	// Get initial data from our load function.
	let { data }: PageProps = $props();

	// Create a superForm for the combined configuration.
	// Expected structure: { view: {...}, gauges: [...], alerts: [...] }
	const { form, enhance, submitting } = superForm(data.form, {
		dataType: 'json',
		SPA: true,
		validators: zod(SingleViewEditSchema),
		onUpdated: ({ form }) => {
			if (form.valid) {
				toast.success('Configuration updated');
			}
		}
	});

	// Store original data for diffing.
	let originalData = structuredClone($form);

	// Compute a shallow diff.
	function getChangedFields(current: any, original: any) {
		const changes: Record<string, any> = {};
		for (const key in current) {
			if (typeof current[key] === 'object' && current[key] !== null) {
				if (JSON.stringify(current[key]) !== JSON.stringify(original[key])) {
					changes[key] = current[key];
				}
			} else if (current[key] !== original[key]) {
				changes[key] = current[key];
			}
		}
		return changes;
	}

	// Send only changed fields to the backend.
	async function patchUpdate() {
		const changes = getChangedFields($form, originalData);
		if (Object.keys(changes).length === 0) return;
		try {
			const response = await fetch('/api/update-config', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changes)
			});
			if (response.ok) {
				toast.success('Configuration updated successfully');
				originalData = structuredClone($form);
			} else {
				toast.error('Update failed');
			}
		} catch (error) {
			console.error(error);
			toast.error('An error occurred while updating');
		}
	}

	// Debounce auto-save calls.
	let saveTimeout: ReturnType<typeof setTimeout>;
	function autoSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(patchUpdate, 1000);
	}

	// Active tab state.
	let activeTab: 'view' | 'gauges' | 'alerts' = $state('view');

	import { onDestroy } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { quintOut, elasticOut } from 'svelte/easing';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Root } from '@/components/ui/avatar';

	// Clean up timeout on unmount
	onDestroy(() => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
	});

	// Add a new gauge
	function addGauge() {
		$form.gauges = [
			...$form.gauges,
			{
				index: $form.gauges.length,
				count: [3, 3],
				cmd: '',
				name: '',
				desc: '',
				type: '',
				dataType: '',
				default: 'THEME_STOCK_ST',
				options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
				limit: '',
				EEBytes: 0,
				theme: 'THEME_STOCK_ST',
				pid: ''
			}
		];
		autoSave();
	}

	// Remove a gauge
	function removeGauge(index: number) {
		$form.gauges = $form.gauges.filter((_, i) => i !== index);
		autoSave();
	}

	// Add a new alert
	function addAlert() {
		$form.alerts = [
			...$form.alerts,
			{
				index: $form.alerts.length,
				count: 5,
				cmd: '',
				name: '',
				desc: '',
				type: '',
				dataType: '',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: '',
				EEBytes: 0,
				pid: '',
				message: '',
				compare: 'Equal'
			}
		];
		autoSave();
	}

	// Remove an alert
	function removeAlert(index: number) {
		$form.alerts = $form.alerts.filter((_, i) => i !== index);
		autoSave();
	}
</script>

<form use:enhance class="mx-auto max-w-4xl">
	<Tabs.Root bind:value={activeTab} class="w-full">
		<!-- Tabs Header -->
		<div class="sticky top-0 z-10 bg-white/90 py-4 backdrop-blur-sm">
			<Tabs.List class="mx-auto grid w-full max-w-3xl grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
				<Tabs.Trigger
					value="view"
					class="data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-b"
				>
					<div class="flex items-center justify-center gap-2">
						<Settings class="h-4 w-4" />
						<span>Settings</span>
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="gauges"
					class="data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-b"
				>
					<div class="flex items-center justify-center gap-2">
						<Gauge class="h-4 w-4" />
						<span>Gauges</span>
						<Badge variant="outline" class="bg-primary/10 ml-1">{$form.gauges.length}</Badge>
					</div>
				</Tabs.Trigger>
				<Tabs.Trigger
					value="alerts"
					class="data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-b"
				>
					<div class="flex items-center justify-center gap-2">
						<Bell class="h-4 w-4" />
						<span>Alerts</span>
						<Badge variant="outline" class="bg-primary/10 ml-1">{$form.alerts.length}</Badge>
					</div>
				</Tabs.Trigger>
			</Tabs.List>
		</div>

		<!-- Tabs Content -->
		<div class="mt-8 space-y-8 pb-12">
			<!-- View Settings Tab -->
			<Tabs.Content value="view" class="space-y-4">
				{#if activeTab === 'view'}
					<div
						in:fly={{ y: 20, duration: 300, easing: quintOut }}
						out:fly={{ y: -20, duration: 300, easing: quintOut }}
					>
						<Motion.div>
							<Card.Root class="overflow-hidden border shadow-lg">
								<Card.Header class="from-primary/10 to-primary/5 rounded-t-lg bg-gradient-to-r p-6">
									<Card.Title class="flex items-center gap-2 text-xl">
										<Settings class="text-primary h-5 w-5" />
										View Settings
									</Card.Title>
									<Card.Description>Configure your basic view settings</Card.Description>
								</Card.Header>
								<Card.Content class="space-y-6 p-6">
									<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
										<div class="space-y-2">
											<Label for="view-name" class="text-sm font-medium">View Name</Label>
											<Input
												id="view-name"
												type="text"
												bind:value={$form.view.name}
												placeholder="Enter view name"
												onblur={autoSave}
												class="focus:ring-primary/20 transition-all duration-200 focus:ring-2"
											/>
										</div>
										<div class="flex items-center space-x-4">
											<div class="flex flex-col space-y-2">
												<Label for="view-enabled" class="text-sm font-medium">Enabled</Label>
												<div class="flex items-center space-x-2">
													<Switch
														id="view-enabled"
														bind:checked={$form.view.enabled}
														onchange={autoSave}
														class="data-[state=checked]:bg-primary"
													/>
													<span class="text-sm">{$form.view.enabled ? 'Active' : 'Inactive'}</span>
												</div>
											</div>
										</div>
									</div>
									<div class="space-y-2">
										<Label for="view-background" class="text-sm font-medium">Background</Label>
										<Select.Root bind:value={$form.view.background} onchange={autoSave}>
											<Select.Trigger
												class="focus:ring-primary/20 w-full transition-all duration-200 focus:ring-2"
											>
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="BACKGROUND_BLACK.png">Black</Select.Item>
												<Select.Item value="BACKGROUND_FLARE.png">Flare</Select.Item>
												<Select.Item value="BACKGROUND_GALAXY.png">Galaxy</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</Card.Content>
								<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-6">
									<Button
										type="button"
										onclick={patchUpdate}
										disabled={$submitting}
										class="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 cursor-pointer"
									>
										{#if $submitting}
											<span class="flex items-center gap-2">
												<svg
													class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Saving...
											</span>
										{:else}
											<span class="flex items-center gap-2">
												<Save class="mr-1 h-5 w-5" />
												Save View
												<ChevronRight class="h-3 w-3 opacity-70" />
											</span>
										{/if}
									</Button>
								</Card.Footer>
							</Card.Root>
						</Motion.div>
					</div>
				{/if}
			</Tabs.Content>

			<!-- Gauges Tab -->
			<Tabs.Content value="gauges" class="space-y-4">
				{#if activeTab === 'gauges'}
					<div
						in:fly={{ y: 20, duration: 300, easing: quintOut }}
						out:fly={{ y: -20, duration: 300, easing: quintOut }}
					>
						<Motion.div>
							<Card.Root class="overflow-hidden border shadow-lg">
								<Card.Header class="from-primary/10 to-primary/5 rounded-t-lg bg-gradient-to-r p-6">
									<Card.Title class="flex items-center gap-2 text-xl">
										<Gauge class="text-primary h-5 w-5" />
										Gauges Configuration
									</Card.Title>
									<Card.Description>
										Configure the gauges (max {$form.gauges[0]?.count[0] || 3} per view)
									</Card.Description>
								</Card.Header>
								<Card.Content class="space-y-6 p-6">
									<AnimatePresence>
										{#each $form.gauges as gauge, i (i)}
											<div
												in:slide={{ duration: 200, easing: quintOut }}
												out:slide={{ duration: 200, easing: quintOut }}
												animate:flip={{ duration: 300 }}
											>
												<Motion.div key={i} class="overflow-hidden">
													<div
														class="bg-card space-y-3 rounded-lg border p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
													>
														<div class="flex items-center justify-between">
															<span class="text-primary font-semibold">Gauge #{i + 1}</span>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onclick={() => removeGauge(i)}
																class="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full p-0 transition-colors duration-200 cursor-pointer"
															>
																<Trash2 class="h-4 w-4" />
															</Button>
														</div>
														<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
															<div class="space-y-2">
																<Label for={`gauge-pid-${i}`} class="text-sm">PID</Label>
																<Input
																	id={`gauge-pid-${i}`}
																	type="text"
																	bind:value={gauge.pid}
																	onblur={autoSave}
																	class="focus:ring-primary/20 transition duration-200 focus:ring-2"
																/>
															</div>
															<div class="space-y-2">
																<Label for={`gauge-name-${i}`} class="text-sm">Name</Label>
																<Input
																	id={`gauge-name-${i}`}
																	type="text"
																	bind:value={gauge.name}
																	onblur={autoSave}
																	class="focus:ring-primary/20 transition duration-200 focus:ring-2"
																/>
															</div>
														</div>
													</div>
												</Motion.div>
											</div>
										{/each}
									</AnimatePresence>
									<Motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
										<Button
											type="button"
											variant="outline"
											onclick={addGauge}
											class="hover:border-primary/50 hover:bg-primary/5 w-full border-dashed transition duration-200 cursor-pointer"
										>
											<Plus class="mr-2 h-4 w-4" /> Add Gauge
										</Button>
									</Motion.div>
								</Card.Content>
								<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-6">
									<Button
										type="button"
										onclick={patchUpdate}
										disabled={$submitting}
										class="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition duration-200 hover:shadow-lg cursor-pointer"
									>
										{#if $submitting}
											<span class="flex items-center gap-2">
												<svg
													class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Saving...
											</span>
										{:else}
											<span class="flex items-center gap-2">
												<Save class="mr-1 h-5 w-5" />
												Save Gauges
												<ChevronRight class="h-3 w-3 opacity-70" />
											</span>
										{/if}
									</Button>
								</Card.Footer>
							</Card.Root>
						</Motion.div>
					</div>
				{/if}
			</Tabs.Content>

			<!-- Alerts Tab -->
			<Tabs.Content value="alerts" class="space-y-4">
				{#if activeTab === 'alerts'}
					<div
						in:fly={{ y: 20, duration: 300, easing: quintOut }}
						out:fly={{ y: -20, duration: 300, easing: quintOut }}
					>
						<Motion.div>
							<Card.Root class="overflow-hidden border shadow-lg">
								<Card.Header class="from-primary/10 to-primary/5 rounded-t-lg bg-gradient-to-r p-6">
									<Card.Title class="flex items-center gap-2 text-xl">
										<Bell class="text-primary h-5 w-5" />
										Alerts Configuration
									</Card.Title>
									<Card.Description
										>Configure your alerts (max {$form.alerts[0]?.count || 5} alerts)</Card.Description
									>
								</Card.Header>
								<Card.Content class="space-y-6 p-6">
									<AnimatePresence>
										{#each $form.alerts as alert, i (i)}
											<div
												in:slide={{ duration: 200, easing: quintOut }}
												out:slide={{ duration: 200, easing: quintOut }}
												animate:flip={{ duration: 300 }}
											>
												<Motion.div key={i} class="overflow-hidden">
													<div
														class="bg-card space-y-3 rounded-lg border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md"
													>
														<div class="flex items-center justify-between">
															<span class="text-primary font-semibold">Alert #{i + 1}</span>
															<Button
																type="button"
																variant="ghost"
																size="sm"
																onclick={() => removeAlert(i)}
																class="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-full p-0 transition-colors duration-200 cursor-pointer"
															>
																<Trash2 class="h-4 w-4" />
															</Button>
														</div>
														<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
															<div class="space-y-2">
																<Label for={`alert-pid-${i}`} class="text-sm">PID</Label>
																<Input
																	id={`alert-pid-${i}`}
																	type="text"
																	bind:value={alert.pid}
																	onblur={autoSave}
																	class="focus:ring-primary/20 transition duration-200 focus:ring-2"
																/>
															</div>
															<div class="space-y-2">
																<Label for={`alert-message-${i}`} class="text-sm">Message</Label>
																<Input
																	id={`alert-message-${i}`}
																	type="text"
																	bind:value={alert.message}
																	onblur={autoSave}
																	class="focus:ring-primary/20 transition duration-200 focus:ring-2"
																/>
															</div>
														</div>
													</div>
												</Motion.div>
											</div>
										{/each}
									</AnimatePresence>
									<Motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
										<Button
											type="button"
											variant="outline"
											onclick={addAlert}
											class="hover:border-primary/50 hover:bg-primary/5 w-full border-dashed transition duration-200 cursor-pointer"
										>
											<Plus class="mr-2 h-4 w-4" /> Add Alert
										</Button>
									</Motion.div>
								</Card.Content>
								<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-6">
									<Button
										type="button"
										onclick={patchUpdate}
										disabled={$submitting}
										class="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition duration-200 hover:shadow-lg cursor-pointer cursor-pointer"
									>
										{#if $submitting}
											<span class="flex items-center gap-2">
												<svg
													class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Saving...
											</span>
										{:else}
											<span class="flex items-center gap-2">
												<Save class="mr-1 h-5 w-5" />
												Save Alerts
												<ChevronRight class="h-3 w-3 opacity-70" />
											</span>
										{/if}
									</Button>
								</Card.Footer>
							</Card.Root>
						</Motion.div>
					</div>
				{/if}
			</Tabs.Content>
		</div>

		<Motion.div
			class="fixed bottom-6 right-6 z-10"
			initial={{ scale: 0.8, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ delay: 0.5 }}
		>
			<Motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					type="submit"
					disabled={$submitting}
					class="bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-full px-6 shadow-lg transition duration-200 cursor-pointer"
				>
					{#if $submitting}
						<span class="flex items-center gap-2">
							<svg
								class="-ml-1 mr-2 h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Saving...
						</span>
					{/if}
				</Button>
			</Motion.div>
		</Motion.div>
	</Tabs.Root>
</form>

<style>
	/* Additional styles for animations and effects */
	:global(.scale-103) {
		transform: scale(1.03);
	}
	:global(.scale-102) {
		transform: scale(1.02);
	}
	:global(.scale-101) {
		transform: scale(1.01);
	}
	:global(.scale-99) {
		transform: scale(0.99);
	}
	:global(.scale-98) {
		transform: scale(0.98);
	}

	/* Add a subtle pulse animation to the save button when there are unsaved changes */
	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(var(--color-primary), 0.7);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(var(--color-primary), 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(var(--color-primary), 0);
		}
	}

	/* Smooth hover transitions for all interactive elements */
	:global(button),
	:global(input),
	:global(select) {
		transition: all 0.2s ease;
	}

	/* Enhanced focus styles */
	:global(input:focus),
	:global(select:focus) {
		outline: none;
		box-shadow: 0 0 0 2px rgba(var(--color-primary), 0.3);
	}

	/* Card hover effect */
	:global(.card:hover) {
		transform: translateY(-2px);
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}
</style>
