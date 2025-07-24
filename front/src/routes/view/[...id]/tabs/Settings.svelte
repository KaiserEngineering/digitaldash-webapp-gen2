<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Image } from 'lucide-svelte';
	import ImageSelect from '$lib/components/ImageSelect.svelte';

	let { form, backgrounds, selectedBackground = $bindable() } = $props();

	const handleBackgroundSelect = (value: string) => {
		selectedBackground = value;
		$form.background = value;
	};
</script>

<Tabs.Content value="view" class="focus:outline-none">
	<Card.Root class="border-0 bg-transparent shadow-none">
		<Card.Content class="space-y-6 px-0">
			<div
				class="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4"
			>
				<div>
					<Label for="enable" class="text-sm font-medium">View Status</Label>
					<p class="text-muted-foreground mt-1 text-xs">Enable or disable this view</p>
				</div>
				<div class="flex items-center gap-3">
					<Switch
						class="border {$form.enable === 'Enabled'
							? 'bg-muted border-green-300'
							: 'border-primary !bg-red-200'}"
						id="enable"
						name="enable"
						checked={$form.enable === 'Enabled'}
						onCheckedChange={(checked) => ($form.enable = checked ? 'Enabled' : 'Disabled')}
					/>
					<span
						class={`rounded-full px-2 py-1 text-xs font-medium ${
							$form.enable === 'Enabled'
								? 'bg-muted text-success'
								: 'bg-muted text-muted-foreground'
						}`}
					>
						{$form.enable === 'Enabled' ? 'Active' : 'Inactive'}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Image class="text-muted-foreground h-4 w-4" />
				<Label for="view-background" class="text-sm font-medium">Background Image</Label>
			</div>

			<ImageSelect
				bind:value={selectedBackground}
				options={backgrounds}
				onSelect={handleBackgroundSelect}
				class="w-full"
			/>
		</Card.Content>
	</Card.Root>
</Tabs.Content>

<input type="hidden" bind:value={$form.num_gauges} />
<input type="hidden" bind:value={$form.type} />
<input type="hidden" bind:value={$form.dataType} />
