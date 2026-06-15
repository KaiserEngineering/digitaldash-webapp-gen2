<script lang="ts">
	import { onMount } from 'svelte';
	import { Thermometer, Loader, TriangleAlert, RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let status: 'loading' | 'success' | 'error' = $state('loading');
	let tempC: number | null = $state(null);

	async function loadTemp() {
		status = 'loading';
		try {
			const res = await fetch('/api/system/info');
			const data = await res.json();
			if (!res.ok) throw new Error('Failed to load system info');
			tempC = data.cpu_temp_c;
			status = 'success';
		} catch {
			status = 'error';
			tempC = null;
		}
	}

	function getTempColor(t: number): string {
		if (t < 60) return 'text-green-600';
		if (t < 80) return 'text-yellow-600';
		return 'text-red-600';
	}

	onMount(() => {
		loadTemp();
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-2 font-medium">
			<Thermometer class="h-5 w-5" />
			CPU Temperature
		</h3>
		<Button onclick={loadTemp} disabled={status === 'loading'} variant="outline" size="sm">
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
				<span>Reading temperature...</span>
			</div>
		{:else if status === 'error'}
			<div class="flex items-center justify-center gap-3 py-4 text-red-600">
				<TriangleAlert class="h-5 w-5" />
				<span>Failed to read temperature</span>
			</div>
		{:else if tempC !== null}
			<div class="flex items-center justify-center gap-3">
				<Thermometer class="h-8 w-8 {getTempColor(tempC)}" />
				<span class="text-3xl font-bold {getTempColor(tempC)}">{tempC.toFixed(0)} °C</span> <!-- No decimal because floating accuracy seems to be broken (it's always .4) -->
			</div>
			{#if tempC >= 80}
				<div class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
					<div class="flex items-center gap-2">
						<TriangleAlert class="h-4 w-4 text-red-600" />
						<span class="text-sm font-medium text-red-800">High CPU Temperature</span>
					</div>
					<p class="mt-1 text-xs text-red-700">
						The ESP32 is running hot. Ensure adequate ventilation.
					</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
