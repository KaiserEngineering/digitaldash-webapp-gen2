<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Gauge as GaugeIcon, ChevronDown } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import ImageSelect from '$lib/components/ImageSelect.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';
	import { onMount } from 'svelte';

	let { themes = [], pids = [], form } = $props();

	// Ensure we always have at least 3 gauge slots available
	function ensureMinimumGauges() {
		if (!$form.gauge) {
			$form.gauge = [];
		}
		// Always ensure we have exactly 3 slots, regardless of current length
		while ($form.gauge.length < 3) {
			$form.gauge.push({ pid: '', units: '', theme: '' });
		}
	}

	// Run on mount to ensure initial state
	onMount(ensureMinimumGauges);
</script>

<Tabs.Content value="gauges" class="focus:outline-none">
	<div class="space-y-4">
		<!-- Mobile-optimized number selector -->
		<div class="bg-background sticky top-0 z-10 pb-2 pt-1">
			<div class="bg-muted/50 flex items-center justify-between rounded-lg p-3 backdrop-blur-sm">
				<Label class="text-sm font-medium">Number of Gauges</Label>
				<Select.Root
					type="single"
					bind:value={$form.num_gauges}
					name="num_gauges"
					onValueChange={(e: string | number) => {
						$form.num_gauges = +e;
						ensureMinimumGauges();
					}}
				>
					<Select.Trigger class="!h-10 min-w-[100px] touch-manipulation">
						<span>{$form.num_gauges} Gauges</span>
					</Select.Trigger>
					<Select.Content>
						{#each [0, 1, 2, 3] as n (n)}
							<Select.Item value={n.toString()} label={`${n} Gauges`} class="py-3 text-base">
								{n} Gauges
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<!-- Mobile-optimized gauge cards with built-in collapsible -->
		{#each { length: $form.num_gauges }, i (i)}
			{@const gauge = $form.gauge?.[i] ?? { pid: '', units: '', theme: '' }}
			<Collapsible.Root>
				<Card.Root class="border-border overflow-hidden">
					<!-- Touchable header that expands/collapses the card -->
					<Collapsible.Trigger class="w-full">
						<Card.Header
							class="hover:bg-muted/50 flex flex-row items-center justify-between p-4 transition-colors"
						>
							<div class="flex items-center gap-3">
								<div class="bg-muted rounded-lg p-2">
									<GaugeIcon class="text-muted-foreground h-5 w-5" />
								</div>
								<div class="text-left">
									<h4 class="text-foreground font-medium">Gauge {i + 1}</h4>
									<p class="text-muted-foreground text-xs">
										{gauge.pid || 'No PID selected'}
										{#if gauge.theme}• {gauge.theme}{/if}
									</p>
								</div>
							</div>
							<ChevronDown
								class="text-muted-foreground h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180"
							/>
						</Card.Header>
					</Collapsible.Trigger>

					<!-- Collapsible content -->
					<Collapsible.Content>
						<Card.Content class="space-y-5 p-4 pt-0">
							<!-- PID & Unit Selector -->
							{#if $form.gauge?.[i]}
								<PIDSelect
									bind:pidValue={$form.gauge[i].pid}
									bind:unitValue={$form.gauge[i].units}
									{pids}
								/>
							{/if}

							<!-- Theme Selector - Full width on mobile -->
							{#if $form.gauge?.[i]}
								<div class="space-y-2">
									<Label class="text-sm font-medium">Theme</Label>
									<ImageSelect
										value={$form.gauge[i].theme}
										options={themes}
										onSelect={(value: string) => ($form.gauge[i].theme = value)}
										class="w-full"
										themes={true}
									/>
								</div>
							{/if}
						</Card.Content>
					</Collapsible.Content>
				</Card.Root>
			</Collapsible.Root>
		{/each}
	</div>
</Tabs.Content>

<style>
	/* Optimize touch targets for mobile */
	:global(.touch-manipulation) {
		touch-action: manipulation;
	}

	/* Add some mobile-specific styles */
	@media (max-width: 640px) {
		:global(.select-content) {
			width: 100%;
			max-width: 100vw;
		}
	}
</style>
