<script lang="ts">
	import { onMount } from 'svelte';
	import { HardDrive, Loader, AlertTriangle, RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface SpiffsInfo {
		success: boolean;
		total: number;
		used: number;
		free: number;
		usage_percent: number;
	}

	let status: 'loading' | 'success' | 'error' = $state('loading');
	let spiffsInfo: SpiffsInfo | null = $state(null);
	let lastUpdated = $state<Date | null>(null);

	async function loadSpiffsInfo() {
		status = 'loading';
		try {
			const response = await fetch('/api/spiffs/info');
			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.message || 'Failed to load SPIFFS info');
			}

			spiffsInfo = data;
			lastUpdated = new Date();
			status = 'success';
		} catch (error) {
			console.error('Failed to load SPIFFS info:', error);
			status = 'error';
			spiffsInfo = null;
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getUsageColor(percentage: number): string {
		if (percentage < 60) return 'bg-green-500';
		if (percentage < 80) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	onMount(() => {
		loadSpiffsInfo();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-2 font-medium">
			<HardDrive class="h-5 w-5" />
			Flash Storage Usage
		</h3>
		<Button onclick={loadSpiffsInfo} disabled={status === 'loading'} variant="outline" size="sm">
			{#if status === 'loading'}
				<Loader class="mr-2 h-4 w-4 animate-spin" />
				Loading...
			{:else}
				<RefreshCw class="mr-2 h-4 w-4" />
				Refresh
			{/if}
		</Button>
	</div>

	<div class="border-border bg-muted rounded-lg border p-4">
		{#if status === 'loading'}
			<div class="text-muted-foreground flex items-center justify-center gap-3 py-4">
				<Loader class="h-5 w-5 animate-spin" />
				<span>Loading storage information...</span>
			</div>
		{:else if status === 'error'}
			<div class="flex items-center justify-center gap-3 py-4 text-red-600">
				<AlertTriangle class="h-5 w-5" />
				<span>Failed to load storage information</span>
			</div>
		{:else if spiffsInfo}
			<div class="space-y-4">
				<!-- Usage Bar -->
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="font-medium">Storage Usage</span>
						<span>{spiffsInfo.usage_percent.toFixed(1)}%</span>
					</div>
					<div class="bg-muted-foreground/20 h-3 w-full overflow-hidden rounded-full">
						<div
							class="h-full transition-all duration-500 {getUsageColor(spiffsInfo.usage_percent)}"
							style="width: {Math.min(spiffsInfo.usage_percent, 100)}%"
						></div>
					</div>
				</div>

				<!-- Storage Stats -->
				<div class="grid grid-cols-3 gap-4 text-sm">
					<div class="text-center">
						<div class="text-muted-foreground">Total</div>
						<div class="font-semibold">{formatBytes(spiffsInfo.total)}</div>
					</div>
					<div class="text-center">
						<div class="text-muted-foreground">Used</div>
						<div class="font-semibold">{formatBytes(spiffsInfo.used)}</div>
					</div>
					<div class="text-center">
						<div class="text-muted-foreground">Free</div>
						<div class="font-semibold">{formatBytes(spiffsInfo.free)}</div>
					</div>
				</div>

				{#if lastUpdated}
					<div class="text-muted-foreground text-center text-xs">
						Last updated: {lastUpdated.toLocaleTimeString()}
					</div>
				{/if}

				<!-- Warning for high usage -->
				{#if spiffsInfo.usage_percent > 85}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3">
						<div class="flex items-center gap-2">
							<AlertTriangle class="h-4 w-4 text-red-600" />
							<span class="text-sm font-medium text-red-800">Storage Almost Full</span>
						</div>
						<p class="mt-1 text-xs text-red-700">
							Consider deleting unused files to free up space for firmware uploads.
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
