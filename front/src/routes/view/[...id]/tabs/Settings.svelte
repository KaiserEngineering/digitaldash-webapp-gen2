<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Image } from 'lucide-svelte';
	import * as Select from '@/components/ui/select';

	let { form, backgrounds } = $props();

	const backgroundTriggerContent = $derived(
		backgrounds.find((f: string) => f.toLowerCase() === $form.background.toLowerCase()) ??
			'Select a background'
	);
</script>

<Tabs.Content value="view" class="focus:outline-none">
	<div class="space-y-6">
		<Card.Root class="border-0 bg-transparent shadow-none">
			<Card.Content class="space-y-6 px-0">
				<div
					class="bg-muted/30 border-border/50 flex items-center justify-between rounded-lg border p-4"
				>
					<div>
						<Label for="enabled" class="text-sm font-medium">View Status</Label>
						<p class="text-muted-foreground mt-1 text-xs">Enable or disable this view</p>
					</div>
					<div class="flex items-center gap-3">
						<Switch
							class="border {$form.enabled
								? 'border-green-300 bg-green-100'
								: 'border-primary !bg-red-200'}"
							id="enabled"
							name="enabled"
							bind:checked={$form.enabled}
						/>
						<span
							class={`rounded-full px-2 py-1 text-xs font-medium ${
								$form.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
							}`}
						>
							{$form.enabled ? 'Active' : 'Inactive'}
						</span>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<Image class="text-muted-foreground h-4 w-4" />
						<Label for="view-background" class="text-sm font-medium">Background Image</Label>
					</div>

					<Select.Root type="single" bind:value={$form.background} name="background">
						<Select.Trigger class="w-full">
							<div class="flex w-full items-center justify-between">
								<span class="truncate">{backgroundTriggerContent}</span>
							</div>
						</Select.Trigger>
						<Select.Content>
							{#each backgrounds as bg (bg)}
								<Select.Item value={bg} label={bg}>
									<div class="flex w-full items-center justify-between">
										<span>{bg}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</Tabs.Content>

<input type="hidden" bind:value={$form.num_gauges} />
<input type="hidden" bind:value={$form.type} />
<input type="hidden" bind:value={$form.dataType} />
