<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ScrollText, Trash2, RefreshCw } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { subscribeToLogs, clearLogs, type LogEntry, type LogLevel } from '$lib/utils/logger';

	let logs: LogEntry[] = $state([]);
	let filterLevel: LogLevel | 'all' = $state('all');
	let unsubscribe: (() => void) | null = null;

	const levelColors: Record<LogLevel, string> = {
		debug: 'text-gray-500',
		info: 'text-blue-600',
		warn: 'text-yellow-600',
		error: 'text-red-600'
	};

	const levelBgColors: Record<LogLevel, string> = {
		debug: 'bg-gray-100',
		info: 'bg-blue-100',
		warn: 'bg-yellow-100',
		error: 'bg-red-100'
	};

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatArgs(args: unknown[]): string {
		if (args.length === 0) return '';
		return args
			.map((arg) => {
				if (typeof arg === 'object') {
					try {
						return JSON.stringify(arg, null, 2);
					} catch {
						return String(arg);
					}
				}
				return String(arg);
			})
			.join(' ');
	}

	function filteredLogs(): LogEntry[] {
		if (filterLevel === 'all') return logs;
		return logs.filter((log) => log.level === filterLevel);
	}

	onMount(() => {
		unsubscribe = subscribeToLogs((entries) => {
			logs = entries;
		});
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<PageCard
	title="Application Logs"
	description="View application logs for debugging. Logs are stored in memory and cleared on page refresh."
	icon={ScrollText}
	footerContent={null}
>
	<!-- Controls -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground text-sm">Filter:</span>
			<select
				bind:value={filterLevel}
				class="border-border bg-background text-foreground rounded border px-2 py-1 text-sm"
			>
				<option value="all">All</option>
				<option value="debug">Debug</option>
				<option value="info">Info</option>
				<option value="warn">Warn</option>
				<option value="error">Error</option>
			</select>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => (logs = logs)} variant="outline" size="sm">
				<RefreshCw class="mr-2 h-4 w-4" />
				Refresh
			</Button>
			<Button onclick={clearLogs} variant="outline" size="sm">
				<Trash2 class="mr-2 h-4 w-4" />
				Clear
			</Button>
		</div>
	</div>

	<!-- Log count -->
	<div class="text-muted-foreground text-sm">
		Showing {filteredLogs().length} of {logs.length} logs
	</div>

	<!-- Log List -->
	<div class="border-border bg-muted max-h-[60vh] min-h-[200px] overflow-y-auto rounded-lg border">
		{#if filteredLogs().length === 0}
			<div class="text-muted-foreground flex items-center justify-center py-8">
				<span class="font-medium">No logs to display</span>
			</div>
		{:else}
			<div class="divide-border divide-y font-mono text-xs">
				{#each filteredLogs().toReversed() as log (log.timestamp.getTime() + log.message)}
					<div class="hover:bg-background p-2 transition-colors">
						<div class="flex flex-wrap items-start gap-2">
							<span class="text-muted-foreground shrink-0">{formatTime(log.timestamp)}</span>
							<span
								class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium uppercase {levelBgColors[
									log.level
								]} {levelColors[log.level]}"
							>
								{log.level}
							</span>
							<span class="text-muted-foreground shrink-0">[{log.module}]</span>
							<span class="text-foreground break-all">{log.message}</span>
						</div>
						{#if log.args.length > 0}
							<pre
								class="text-muted-foreground mt-1 overflow-x-auto pl-4 text-xs whitespace-pre-wrap">{formatArgs(
									log.args
								)}</pre>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</PageCard>
