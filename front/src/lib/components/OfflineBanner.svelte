<script lang="ts">
	import { isOnline, isOfflineReady } from '$lib/stores/offlineStore';
	import { Alert, AlertDescription } from '@/components/ui/alert';
	import { Badge } from '@/components/ui/badge';

	let showBanner = $derived(!($isOnline));
	let canWorkOffline = $derived($isOfflineReady);
</script>

{#if showBanner}
	<Alert class="mb-4 border-orange-200 bg-orange-50">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full bg-orange-500"></div>
				<AlertDescription class="text-orange-800">
					You're currently offline.
					{#if canWorkOffline}
						Viewing cached data.
					{:else}
						Some features may not be available.
					{/if}
				</AlertDescription>
			</div>

			{#if canWorkOffline}
				<Badge variant="secondary" class="bg-green-100 text-green-800">
					Offline Ready
				</Badge>
			{:else}
				<Badge variant="secondary" class="bg-orange-100 text-orange-800">
					Limited Mode
				</Badge>
			{/if}
		</div>
	</Alert>
{/if}