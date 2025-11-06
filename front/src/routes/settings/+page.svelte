<script lang="ts">
	import { Wrench, Save } from 'lucide-svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import { Switch } from '@/components/ui/switch';
	import PageCard from '@/components/PageCard.svelte';
	import toast from 'svelte-5-french-toast';

	// Example settings state
	let deviceName = $state('Digital Dash');
	let autoUpdate = $state(true);
	let brightness = $state(75);
	let submitting = $state(false);

	async function handleSubmit() {
		submitting = true;
		try {
			// TODO: Implement actual settings save logic
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));
			toast.success('Settings saved successfully!');
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast.error('Failed to save settings');
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<PageCard
		title="Settings"
		description="Configure your Digital Dash system preferences and options."
		icon={Wrench}
	>
		<div class="space-y-6">
			<!-- Device Name -->
			<div class="space-y-3">
				<Label class="text-foreground text-sm font-semibold">Device Name</Label>
				<Input
					type="text"
					bind:value={deviceName}
					class="h-12 rounded-xl border-2 transition-all duration-200 border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
					placeholder="Enter device name"
				/>
				<p class="text-muted-foreground text-xs">
					This name will be displayed in the app and used for device identification.
				</p>
			</div>

			<!-- Auto Update Toggle -->
			<div class="bg-muted/50 flex items-center justify-between rounded-xl p-4">
				<div class="flex flex-col">
					<Label class="text-foreground text-sm font-semibold">Automatic Updates</Label>
					<p class="text-muted-foreground text-xs">
						Automatically check for and install firmware updates
					</p>
				</div>
				<Switch
					checked={autoUpdate}
					onCheckedChange={(checked) => (autoUpdate = checked)}
					class="data-[state=checked]:bg-success data-[state=checked]:border-success/30 border-muted bg-muted border"
				/>
			</div>

			<!-- Brightness Slider -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label class="text-foreground text-sm font-semibold">Display Brightness</Label>
					<span class="text-muted-foreground text-sm font-medium">{brightness}%</span>
				</div>
				<input
					type="range"
					bind:value={brightness}
					min="0"
					max="100"
					step="5"
					class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-emerald-500"
				/>
				<p class="text-muted-foreground text-xs">
					Adjust the display brightness level (0-100%)
				</p>
			</div>
		</div>

		{#snippet footerContent()}
			<div class="border-border flex w-full flex-col items-center justify-between gap-4 py-4 md:flex-row">
				<div class="text-muted-foreground text-sm">
					Configure your device settings and preferences
				</div>
				<Button
					type="submit"
					disabled={submitting}
					class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200"
				>
					{#if submitting}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
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
