<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { toast } from 'svelte-5-french-toast';
	import { SingleViewEditSchema } from '$schemas/digitaldash';

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
</script>

<form method="POST" use:enhance>
	<Tabs.Root value={activeTab} class="w-full">
		<Tabs.List class="mx-auto grid w-full max-w-3xl grid-cols-3 rounded-xl p-1">
			<Tabs.Trigger
				value="view"
				onclick={() => (activeTab = 'view')}
				class="data-[state=active]:bg-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg"
			>
				<div class="flex items-center gap-2">
					<Settings class="h-4 w-4" />
					<span>Settings</span>
				</div>
			</Tabs.Trigger>
			<Tabs.Trigger
				value="gauges"
				onclick={() => (activeTab = 'gauges')}
				class="data-[state=active]:bg-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg"
			>
				<div class="flex items-center gap-2">
					<Gauge class="h-4 w-4" />
					<span>Gauges</span>
					<span class="badge badge-outline ml-1">{$form.gauges.length}</span>
				</div>
			</Tabs.Trigger>
			<Tabs.Trigger
				value="alerts"
				onclick={() => (activeTab = 'alerts')}
				class="data-[state=active]:bg-primary/10 data-[state=active]:text-primary cursor-pointer rounded-lg"
			>
				<div class="flex items-center gap-2">
					<Bell class="h-4 w-4" />
					<span>Alerts</span>
					<span class="badge badge-outline ml-1">{$form.alerts.length}</span>
				</div>
			</Tabs.Trigger>
		</Tabs.List>

		<!-- Tabs Content -->
		<div class="mt-8 space-y-8">
			<!-- View Settings Tab -->
			<Tabs.Content value="view">
				<Card.Root class="border shadow-lg">
					<Card.Header class="bg-primary/5 rounded-t-lg p-4">
						<Card.Title class="flex items-center gap-2">
							<Settings class="text-primary h-5 w-5" />
							View Settings
						</Card.Title>
						<Card.Description>Configure your basic view settings</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4 p-6">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="view-name" class="block text-sm font-medium">View Name</Label>
								<Input
									id="view-name"
									type="text"
									bind:value={$form.view.name}
									placeholder="Enter view name"
									class="input input-bordered w-full"
									onblur={autoSave}
								/>
							</div>
							<div class="flex items-center space-x-2">
								<Label for="view-enabled" class="text-sm font-medium">Enabled</Label>
								<Switch id="view-enabled" bind:checked={$form.view.enabled} onchange={autoSave} />
								<span class="text-muted-foreground text-sm">
									{$form.view.enabled ? 'Active' : 'Inactive'}
								</span>
							</div>
						</div>
						<div>
							<Label for="view-background" class="block text-sm font-medium">Background</Label>
							<Select.Root type="single" name="background">
								<Select.Trigger class="input input-bordered w-full"></Select.Trigger>
								<Select.Content>
									<Select.Item value="BACKGROUND_BLACK.png">Black</Select.Item>
									<Select.Item value="BACKGROUND_FLARE.png">Flare</Select.Item>
									<Select.Item value="BACKGROUND_GALAXY.png">Galaxy</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</Card.Content>
					<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-4">
						<Button
							type="button"
							onclick={patchUpdate}
							disabled={$submitting}
							class="flex items-center gap-2"
						>
							{#if submitting}
								<span>Saving...</span>
							{:else}
								<Save class="h-4 w-4" />
								<span>Save View</span>
								<ChevronRight class="h-3 w-3 opacity-70" />
							{/if}
						</Button>
					</Card.Footer>
				</Card.Root>
			</Tabs.Content>

			<!-- Gauges Tab -->
			<Tabs.Content value="gauges">
				<Card.Root class="border shadow-lg">
					<Card.Header class="bg-primary/5 rounded-t-lg p-4">
						<Card.Title class="flex items-center gap-2">
							<Gauge class="text-primary h-5 w-5" />
							Gauges Configuration
						</Card.Title>
						<Card.Description
							>Configure the gauges (max {$form.gauges[0]?.count[0] || 3} per view)</Card.Description
						>
					</Card.Header>
					<Card.Content class="space-y-4 p-6">
						{#each $form.gauges as gauge, i}
							<div class="space-y-2 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<span class="font-semibold">Gauge #{i + 1}</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => {
											$form.gauges = $form.gauges.filter((_, index) => index !== i);
											autoSave();
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<Label for={`gauge-pid-${i}`} class="block text-sm">PID</Label>
										<Input
											id={`gauge-pid-${i}`}
											type="text"
											bind:value={gauge.pid}
											class="input input-bordered w-full"
											onblur={autoSave}
										/>
									</div>
									<div>
										<Label for={`gauge-name-${i}`} class="block text-sm">Name</Label>
										<Input
											id={`gauge-name-${i}`}
											type="text"
											bind:value={gauge.name}
											class="input input-bordered w-full"
											onblur={autoSave}
										/>
									</div>
								</div>
							</div>
						{/each}
						<button
							type="button"
							class="btn btn-outline w-full"
							onclick={() => {
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
							}}
						>
							<Plus class="mr-2 h-4 w-4" /> Add Gauge
						</button>
					</Card.Content>
					<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-4">
						<Button
							type="button"
							onclick={patchUpdate}
							disabled={$submitting}
							class="flex items-center gap-2"
						>
							{#if submitting}
								<span>Saving...</span>
							{:else}
								<Save class="h-4 w-4" />
								<span>Save Gauges</span>
								<ChevronRight class="h-3 w-3 opacity-70" />
							{/if}
						</Button>
					</Card.Footer>
				</Card.Root>
			</Tabs.Content>

			<!-- Alerts Tab -->
			<Tabs.Content value="alerts">
				<Card.Root class="border shadow-lg">
					<Card.Header class="bg-primary/5 rounded-t-lg p-4">
						<Card.Title class="flex items-center gap-2">
							<Bell class="text-primary h-5 w-5" />
							Alerts Configuration
						</Card.Title>
						<Card.Description
							>Configure your alerts (max {$form.alerts[0]?.count || 5} alerts)</Card.Description
						>
					</Card.Header>
					<Card.Content class="space-y-4 p-6">
						{#each $form.alerts as alert, i}
							<div class="space-y-2 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<span class="font-semibold">Alert #{i + 1}</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onclick={() => {
											$form.alerts = $form.alerts.filter((_, index) => index !== i);
											autoSave();
										}}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<Label for={`alert-pid-${i}`} class="block text-sm">PID</Label>
										<Input
											id={`alert-pid-${i}`}
											type="text"
											bind:value={alert.pid}
											class="input input-bordered w-full"
											onblur={autoSave}
										/>
									</div>
									<div>
										<Label for={`alert-message-${i}`} class="block text-sm">Message</Label>
										<Input
											id={`alert-message-${i}`}
											type="text"
											bind:value={alert.message}
											class="input input-bordered w-full"
											onblur={autoSave}
										/>
									</div>
								</div>
								<!-- You can add more fields (like a comparison select) here -->
							</div>
						{/each}
						<button
							type="button"
							class="btn btn-outline w-full"
							onclick={() => {
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
							}}
						>
							<Plus class="mr-2 h-4 w-4" /> Add Alert
						</button>
					</Card.Content>
					<Card.Footer class="bg-muted/10 flex justify-end rounded-b-lg p-4">
						<Button
							type="button"
							onclick={patchUpdate}
							disabled={$submitting}
							class="flex items-center gap-2"
						>
							{#if submitting}
								<span>Saving...</span>
							{:else}
								<Save class="h-4 w-4" />
								<span>Save Alerts</span>
								<ChevronRight class="h-3 w-3 opacity-70" />
							{/if}
						</Button>
					</Card.Footer>
				</Card.Root>
			</Tabs.Content>
		</div>

		<!-- Optional manual save trigger -->
		<div class="mt-4 text-center">
			<Button type="button" onclick={patchUpdate} disabled={$submitting}>Save Changes</Button>
		</div>
	</Tabs.Root>
</form>

<style lang="postcss">
	:global(.dark) {
		--background: 222.2 84% 4.9%;
		--foreground: 210 40% 98%;
		--primary: 217.2 91.2% 59.8%;
		--primary-foreground: 222.2 47.4% 11.2%;
		--border: 217.2 32.6% 17.5%;
		--input: 217.2 32.6% 17.5%;
		--muted: 217.2 32.6% 17.5%;
		--muted-foreground: 215 20.2% 65.1%;
	}

	:global(:root) {
		--background: 0 0% 100%;
		--foreground: 222.2 84% 4.9%;
		--primary: 221.2 83.2% 53.3%;
		--primary-foreground: 210 40% 98%;
		--border: 214.3 31.8% 91.4%;
		--input: 214.3 31.8% 91.4%;
		--muted: 210 40% 96.1%;
		--muted-foreground: 215.4 16.3% 46.9%;
	}
</style>
