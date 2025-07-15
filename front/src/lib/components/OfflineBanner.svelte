<script lang="ts">
	import { isOnline, isOfflineReady, isDeviceConnected, offlineStore } from '$lib/stores/offlineStore';
	import { Alert, AlertDescription } from '@/components/ui/alert';
	import { Badge } from '@/components/ui/badge';

	let online = $derived($isOnline);
	let deviceConnected = $derived($isDeviceConnected);
	let canWorkOffline = $derived($isOfflineReady);
	let hasOfflineData = $derived($offlineStore.config !== null);
	
	// Show banner if offline OR device disconnected
	let showBanner = $derived(!online || !deviceConnected);
	
	// Determine the type of connectivity issue
	let connectionStatus = $derived.by(() => {
		if (!online && !deviceConnected) {
			return { type: 'offline', message: 'No internet connection' };
		} else if (!deviceConnected) {
			return { type: 'device', message: 'Not connected to DigitalDash device' };
		} else if (!online) {
			return { type: 'internet', message: 'No internet connection' };
		}
		return null;
	});
</script>

{#if showBanner && connectionStatus}
	<Alert class="mb-4 {connectionStatus.type === 'device' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full {connectionStatus.type === 'device' ? 'bg-red-500' : 'bg-orange-500'}"></div>
				<AlertDescription class="{connectionStatus.type === 'device' ? 'text-red-800' : 'text-orange-800'} w-full">
					{connectionStatus.message}
					{#if connectionStatus.type === 'device' && !hasOfflineData}
						- No cached data available. Connect to your DigitalDash device to load the app.
					{:else if connectionStatus.type === 'device' && hasOfflineData}
						- Viewing cached dashboard data.
					{:else if canWorkOffline}
						- Viewing cached data.
					{:else}
						- Some features may not be available.
					{/if}
				</AlertDescription>
			</div>
			
			<div class="flex gap-2">
				{#if connectionStatus.type === 'device'}
					<Badge variant="destructive" class="text-xs">
						Device Offline
					</Badge>
				{:else if canWorkOffline}
					<Badge variant="secondary" class="bg-green-100 text-green-800 text-xs">
						Cached Mode
					</Badge>
				{:else}
					<Badge variant="secondary" class="bg-orange-100 text-orange-800 text-xs">
						Limited Mode
					</Badge>
				{/if}
			</div>
		</div>
	</Alert>
{/if}