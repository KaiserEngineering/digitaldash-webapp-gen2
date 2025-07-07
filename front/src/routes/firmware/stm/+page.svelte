<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
	import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-svelte';

	let status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
	let message = '';

	async function updateFirmware() {
		status = 'loading';
		message = '';

		try {
			const res = await fetch('/api/firmware/stm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await res.json();

			if (!res.ok) throw new Error(data.message || 'Firmware update failed');

			status = 'success';
			message = data.message || 'Firmware updated successfully';
		} catch (err) {
			status = 'error';
			message = err.message || 'An error occurred';
		}
	}
</script>

<Card class="mx-auto mt-8 max-w-md">
	<CardHeader>
		<CardTitle>Update STM Firmware</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<Button on:click={updateFirmware} disabled={status === 'loading'} class="w-full">
			{#if status === 'loading'}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Updating...
			{:else}
				Update Firmware
			{/if}
		</Button>

		{#if status === 'success'}
			<p class="flex items-center gap-2 text-sm text-green-600">
				<CheckCircle class="h-4 w-4" />
				{message}
			</p>
		{:else if status === 'error'}
			<p class="flex items-center gap-2 text-sm text-red-600">
				<AlertTriangle class="h-4 w-4" />
				{message}
			</p>
		{/if}
	</CardContent>
</Card>
