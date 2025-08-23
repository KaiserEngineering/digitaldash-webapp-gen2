<script lang="ts">
	import DashboardCard from '@/components/DashboardCard.svelte';
	import ViewCard from '@/components/ViewCard.svelte';
	import { configStore } from '$lib/stores/configStore';
	import { pidsStore } from '$lib/stores/PIDsStore';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Bell, Zap, ChevronRight } from 'lucide-svelte';

	const views = $derived($configStore?.view || []);
	const pids = $derived(pidsStore.getValue());
	const alerts = $derived($configStore?.alert || []);
	const dynamic = $derived($configStore?.dynamic || []);

	// Real alerts data
	const alertsSummary = $derived({
		total: alerts.length,
		active: alerts.filter((alert) => alert.enable === 'Enabled').length
	});

	// Real dynamic rules data
	const dynamicSummary = $derived({
		total: dynamic.length,
		active: dynamic.filter((rule) => rule.enable === 'Enabled').length
	});
</script>

<!-- Views Dashboard -->
<div class="space-y-6">
	<DashboardCard class="pt-0">
		{#each views as view, index (index)}
			<ViewCard {view} {index} {pids} />
		{/each}
	</DashboardCard>
</div>

<!-- System Overview Card -->
<Card
	class="bg-card/80 border-0 mt-5 pt-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
>
	<CardContent class="space-y-4">
		<!-- Alerts Row -->
		<a href="/alerts" class="block">
			<div
				class="m-2 flex items-center gap-3 rounded-lg bg-red-50/50 p-4 transition-all duration-200 hover:bg-red-100/50 dark:bg-red-900/10 dark:hover:bg-red-900/20"
			>
				<div class="rounded-md bg-red-100 p-2 dark:bg-red-900/30">
					<Bell class="h-4 w-4 text-red-600 dark:text-red-400" />
				</div>
				<div class="flex-1">
					<h3 class="text-foreground font-medium">Alerts</h3>
					<p class="text-foreground text-sm font-medium">
						{alertsSummary.active} / {alertsSummary.total} active
					</p>
					{#if alertsSummary.active > 0}
						<div class="mt-2 space-y-1">
							{#each alerts.filter((alert) => alert.enable === 'Enabled') as alert, index}
								<div class="text-foreground/70 text-xs">
									Alert #{index + 1}: Show when {alert.pid || 'No PID'}
									{alert.compare || ''}
									{alert.threshold || ''}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				<ChevronRight class="text-muted-foreground h-4 w-4" />
			</div>
		</a>

		<!-- Dynamic Rules Row -->
		<a href="/dynamic" class="block">
			<div
				class="m-2 flex items-center gap-3 rounded-lg bg-blue-50/50 p-4 transition-all duration-200 hover:bg-blue-100/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20"
			>
				<div class="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
					<Zap class="h-4 w-4 text-blue-600 dark:text-blue-400" />
				</div>
				<div class="flex-1">
					<h3 class="text-foreground font-medium">Dynamic</h3>
					<p class="text-foreground text-sm font-medium">
						{dynamicSummary.active} / {dynamicSummary.total} active
					</p>
					{#if dynamicSummary.active > 0}
						<div class="mt-2 space-y-1">
							{#each dynamic.filter((rule) => rule.enable === 'Enabled') as rule, index}
								<div class="text-foreground/70 text-xs">
									{#if rule.priority === 'Low'}
										Default: View #{rule.view_index !== undefined ? rule.view_index : '0'}
									{:else}
										{rule.priority || 'Unknown'}: Switch to View #{rule.view_index !== undefined
											? rule.view_index
											: '0'} when {rule.pid || 'No PID'}
										{rule.compare || ''}
										{rule.threshold || ''}
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
				<ChevronRight class="text-muted-foreground h-4 w-4" />
			</div>
		</a>
	</CardContent>
</Card>
