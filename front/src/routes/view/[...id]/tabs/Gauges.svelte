<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Gauge as GaugeIcon } from 'lucide-svelte';
	import * as Select from '@/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';

	let { activeTab = $bindable(), themes = [], pids = [], form } = $props();
</script>

<Tabs.Content value="gauges" class="focus:outline-none">
	<div class="space-y-6">
		{#each $form.gauge as gauge, i (gauge.id)}
			<Card.Root
				class={`border ${gauge.enabled ? 'bg-card border-border' : 'bg-muted/50 border-dashed'}`}
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

					<Switch
						class="border {$form.gauge[i].enabled
							? 'border-green-300 bg-green-100'
							: 'border-primary !bg-red-200'}"
						bind:checked={$form.gauge[i].enabled}
					/>
				</Card.Header>

				<Card.Content class="space-y-4 {$form.gauge[i].enabled ? '' : 'opacity-50'}">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label class="text-sm font-medium">PID Signal</Label>
							<Select.Root
								type="single"
								bind:value={gauge.pid}
								name={`pid-${i}`}
								disabled={!$form.gauge[i].enabled}
							>
								<Select.Trigger class="w-full">
									<span>{gauge.pid || 'Select PID'}</span>
								</Select.Trigger>
								<Select.Content>
									{#each pids as pid (pid)}
										<Select.Item value={pid} label={pid}>
											{pid}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="space-y-2">
							<Label class="text-sm font-medium">Theme</Label>
							<Select.Root
								type="single"
								bind:value={gauge.theme}
								name={`theme-${i}`}
								disabled={!gauge.enabled}
							>
								<Select.Trigger class="w-full">
									<span>{gauge.theme || 'Select Theme'}</span>
								</Select.Trigger>
								<Select.Content>
									{#each themes as theme (theme)}
										<Select.Item value={theme} label={theme}>
											{theme}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</Tabs.Content>
