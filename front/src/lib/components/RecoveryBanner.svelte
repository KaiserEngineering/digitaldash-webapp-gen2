<script lang="ts">
	import { AlertTriangle, Upload, Smartphone, ChevronDown, ChevronRight } from 'lucide-svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	let { recovery } = $props();

	let showDetails = $state(false);

	// Determine the specific issue type for better messaging
	let connectionStatus = $derived.by(() => {
		const hasConfigIssue = recovery.issues.some((issue) => issue.includes('configuration'));
		const hasConnectionIssue = recovery.issues.some(
			(issue) => issue.includes('connect') || issue.includes('fetch')
		);
		const hasPIDIssue = recovery.issues.some((issue) => issue.includes('PID'));

		if (hasConnectionIssue) {
			return {
				type: 'connection',
				message: 'Unable to connect to DigitalDash device',
				detail: 'Check device power and network connection'
			};
		} else if (hasConfigIssue) {
			return {
				type: 'config',
				message: 'Device configuration invalid',
				detail: 'Device may need firmware update or configuration reset'
			};
		} else if (hasPIDIssue) {
			return {
				type: 'pids',
				message: 'PID definitions unavailable',
				detail: 'Device firmware may be incompatible'
			};
		} else {
			return {
				type: 'general',
				message: 'Device issues detected',
				detail: 'Some features may be limited'
			};
		}
	});
</script>

{#if recovery.isRecoveryMode}
	<Alert class="flex flex-col border-red-200 bg-red-50 p-3">
		<!-- Technical details toggle -->
		{#if recovery.issues.length > 0}
			<div class="mb-1 sm:mb-2 sm:ml-4">
				<button
					onclick={() => (showDetails = !showDetails)}
					class="flex items-center gap-1 py-1 text-xs text-red-600 transition-colors hover:text-red-800"
				>
					{#if showDetails}
						<ChevronDown class="h-3 w-3" />
					{:else}
						<ChevronRight class="h-3 w-3" />
					{/if}
					<span>Details ({recovery.issues.length})</span>
				</button>

				{#if showDetails}
					<div class="mt-1 rounded bg-red-100 p-2 text-xs">
						<ul class="space-y-1">
							{#each recovery.issues as issue}
								<li class="leading-snug break-words text-red-800">• {issue}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Action buttons -->
		<div class="mt-1 flex w-full flex-col gap-1.5 sm:ml-4 sm:flex-row sm:gap-2">
			<Button
				size="sm"
				class="h-7 justify-start bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
			>
				<Upload class="mr-1 h-3 w-3" />
				Web App
			</Button>
			<Button
				size="sm"
				class="h-7 justify-start bg-red-600 px-2 text-xs text-white hover:bg-red-700"
			>
				<Smartphone class="mr-1 h-3 w-3" />
				DigitalDash
			</Button>
		</div>
	</Alert>
{/if}
