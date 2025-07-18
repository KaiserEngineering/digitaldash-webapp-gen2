<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Gauge as GaugeIcon, ChevronDown } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import ImageSelect from '$lib/components/ImageSelect.svelte';
	import PIDSelect from '$lib/components/PIDSelect.svelte';

	let { themes = [], pids = [], form } = $props();

	// Helper function to find PID label by desc (since config stores desc but we want to show label)
	function getPidLabelByDesc(pidDesc: string): string {
		if (!pidDesc) return '';
		const pid = pids.find((p) => p.desc === pidDesc);
		return pid ? pid.label : pidDesc; // Fallback to desc if not found
	}

	// Helper function to find PID desc by label (for form selection)
	function getPidDescByLabel(pidLabel: string): string {
		if (!pidLabel) return '';
		const pid = pids.find((p) => p.label === pidLabel);
		return pid ? pid.desc : pidLabel; // Fallback to label if not found
	}

	// Track which gauge card is expanded (for mobile accordion behavior)
	let expandedGaugeIndex = $state<number | null>(null);

	// Toggle expanded state for a gauge card
	function toggleGaugeExpand(index: number) {
		expandedGaugeIndex = expandedGaugeIndex === index ? null : index;
	}

	// Initialize gauge objects if they don't exist
	$effect(() => {
		if ($form.num_gauges > 0 && (!$form.gauge || $form.gauge.length === 0)) {
			$form.gauge = Array($form.num_gauges)
				.fill(null)
				.map(() => ({}));
		}
	});
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
					onValueChange={(e) => ($form.num_gauges = +e)}
				>
					<Select.Trigger class="!h-10 min-w-[100px] touch-manipulation">
						<span>{$form.num_gauges} Gauges</span>
					</Select.Trigger>
					<Select.Content position="popper">
						{#each [0, 1, 2, 3] as n}
							<Select.Item value={n.toString()} label={`${n} Gauges`} class="py-3 text-base">
								{n} Gauges
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<!-- Mobile-optimized gauge cards -->
		{#each Array($form.num_gauges) as _, i}
			{@const gauge = $form.gauge?.[i] ?? {}}
			{@const isExpanded = expandedGaugeIndex === i}

			<Card.Root class="border-border overflow-hidden">
				<!-- Touchable header that expands/collapses the card on mobile -->
				<button
					class="w-full text-left"
					onclick={() => toggleGaugeExpand(i)}
					aria-expanded={isExpanded}
				>
					<Card.Header class="flex flex-row items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="bg-muted rounded-lg p-2">
								<GaugeIcon class="text-muted-foreground h-5 w-5" />
							</div>
							<div>
								<h4 class="text-foreground font-medium">Gauge {i + 1}</h4>
								<p class="text-muted-foreground text-xs">
									{getPidLabelByDesc(gauge.pid) || 'No PID selected'}
									{#if gauge.theme}• {gauge.theme}{/if}
								</p>
							</div>
						</div>
						<ChevronDown
							class="text-muted-foreground h-5 w-5 transition-transform duration-200"
							style={isExpanded ? 'transform: rotate(180deg)' : ''}
						/>
					</Card.Header>
				</button>

				<!-- Card content that shows/hides based on expanded state -->
				{#if isExpanded}
					<Card.Content class="space-y-5 p-4 pt-0">
						<!-- PID & Unit Selector -->
						<PIDSelect
							bind:pidValue={$form.gauge[i].pid}
							bind:unitValue={$form.gauge[i].units}
							{pids}
							useDescription={true}
							{getPidDescByLabel}
							{getPidLabelByDesc}
						/>

						<!-- Theme Selector - Full width on mobile -->
						<div class="space-y-2">
							<Label class="text-sm font-medium">Theme</Label>
							<ImageSelect
								value={$form.gauge[i].theme}
								options={themes}
								placeholder="Choose a theme..."
								onSelect={(value: any) => ($form.gauge[i].theme = value)}
								class="w-full"
								themes={true}
							/>
						</div>
					</Card.Content>
				{/if}
			</Card.Root>
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
