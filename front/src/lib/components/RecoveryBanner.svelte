<script lang="ts">
	import { recoveryStore } from '$lib/stores/recoveryMode';
	import { AlertTriangle, Upload } from 'lucide-svelte';

	let { recovery } = $props();
</script>

{#if recovery.isRecoveryMode}
	<div class="bg-red-600 text-white">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<AlertTriangle class="h-5 w-5 flex-shrink-0" />
					<div>
						<h3 class="font-semibold">Recovery Mode Active</h3>
						<p class="text-sm text-red-100">
							Device configuration issues detected. Some features may be limited.
						</p>
					</div>
				</div>
				<a
					href="/firmware"
					class="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
				>
					<Upload class="h-4 w-4" />
					Update Firmware
				</a>
			</div>

			{#if recovery.issues.length > 0}
				<div class="mt-2 text-sm text-red-100">
					<strong>Issues detected:</strong>
					<ul class="mt-1 ml-4 list-inside list-disc">
						{#each recovery.issues as issue}
							<li>{issue}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
