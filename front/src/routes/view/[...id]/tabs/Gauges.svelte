<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Gauge as GaugeIcon } from 'lucide-svelte';
	import * as Select from '@/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import ImageSelect from '$lib/components/ImageSelect.svelte';

	let { themes = [], pids = [], form } = $props();
</script>

<Tabs.Content value="gauges" class="focus:outline-none">
	<div class="space-y-6">
		{#each Array(3) as _, i}
			{@const gauge = $form.gauge?.[i] ?? {}}
			{@const isEnabled = i < $form.num_gauges}

			<Card.Root
				class={`border ${isEnabled ? 'bg-card border-border' : 'bg-muted/50 border-dashed'}`}
			>
				<Card.Header class="pb-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="bg-muted rounded-lg p-2">
								<GaugeIcon class="text-muted-foreground h-4 w-4" />
							</div>
							<div>
								<h4 class="text-foreground font-medium">Gauge {i + 1}</h4>
								<p class="text-muted-foreground text-xs">
									{gauge.pid || 'No PID selected'} • {gauge.theme || 'No theme selected'}
								</p>
							</div>
						</div>
					</div>

					<Switch class="pointer-events-none opacity-60" checked={isEnabled} />
				</Card.Header>

				<Card.Content class={`space-y-4 ${isEnabled ? '' : 'pointer-events-none opacity-50'}`}>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label class="text-sm font-medium">PID</Label>
							<Select.Root type="single" bind:value={$form.gauge[i].pid} name={`pid-${i}`}>
								<Select.Trigger class="!h-12 w-full">
									<span>{$form.gauge[i].pid || 'Select PID'}</span>
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
