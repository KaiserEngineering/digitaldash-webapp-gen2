<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Gauge as GaugeIcon } from 'lucide-svelte';
	import * as Select from '@/components/ui/select';
	import ImageSelect from '$lib/components/ImageSelect.svelte';

	let { themes = [], pids = [], form } = $props();

	// Helper function to find PID label by desc (since config stores desc but we want to show label)
	function getPidLabelByDesc(pidDesc: string): string {
		if (!pidDesc) return '';
		const pid = pids.find(p => p.desc === pidDesc);
		return pid ? pid.label : pidDesc; // Fallback to desc if not found
	}

	// Helper function to find PID desc by label (for form selection)
	function getPidDescByLabel(pidLabel: string): string {
		if (!pidLabel) return '';
		const pid = pids.find(p => p.label === pidLabel);
		return pid ? pid.desc : pidLabel; // Fallback to label if not found
	}
</script>

<Tabs.Content value="gauges" class="focus:outline-none">
	<div class="space-y-6">
		<div class="mb-4 space-y-2">
			<Label class="text-sm font-medium">Number of Gauges</Label>
			<Select.Root
				type="single"
				bind:value={$form.num_gauges}
				name="num_gauges"
				onValueChange={(e) => ($form.num_gauges = +e)}
			>
				<Select.Trigger class="!h-10 w-40">
					<span>{$form.num_gauges} Gauges</span>
				</Select.Trigger>
				<Select.Content>
					{#each [0, 1, 2, 3] as n}
						<Select.Item value={n.toString()} label={`${n} Gauges`}>
							{n}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		{#each Array($form.num_gauges) as _, i}
			{@const gauge = $form.gauge?.[i] ?? {}}

			<Card.Root class="bg-card border-border border">
				<Card.Header class="pb-4">
					<div class="flex items-center gap-3">
						<div class="bg-muted rounded-lg p-2">
							<GaugeIcon class="text-muted-foreground h-4 w-4" />
						</div>
						<div>
							<h4 class="text-foreground font-medium">Gauge {i + 1}</h4>
							<p class="text-muted-foreground text-xs">
								{getPidLabelByDesc(gauge.pid) || 'No PID selected'} • {gauge.theme || 'No theme selected'}
							</p>
						</div>
					</div>
				</Card.Header>

				<Card.Content class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label class="text-sm font-medium">PID</Label>
							<Select.Root 
								type="single" 
								bind:value={$form.gauge[i].pid} 
								name={`pid-${i}`}
								onValueChange={(selectedLabel) => {
									if (selectedLabel) {
										$form.gauge[i].pid = getPidDescByLabel(selectedLabel);
									}
								}}
							>
								<Select.Trigger class="!h-12 w-full">
									<span>{getPidLabelByDesc($form.gauge[i].pid) || 'Select PID'}</span>
								</Select.Trigger>
								<Select.Content>
									{#each pids as pid (pid)}
										<Select.Item value={pid.label} label={pid.label}>
											{pid.label}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

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
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</Tabs.Content>
