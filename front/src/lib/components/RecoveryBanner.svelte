<script lang="ts">
	import { Upload, Smartphone, ChevronDown, ChevronRight, RotateCcw } from 'lucide-svelte';
	import { Alert } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import toast from 'svelte-5-french-toast';

	let { recovery } = $props();

	let showDetails = $state(false);
	let resetting = $state(false);

	async function resetDigitalDash() {
		if (resetting) return;

		resetting = true;
		try {
			const response = await fetch('/api/reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				toast.success('Digital Dash reset successfully! Please wait a moment for it to restart.');
				// Optionally reload the page after a delay to check if issues are resolved
				setTimeout(() => {
					window.location.reload();
				}, 3000);
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to reset Digital Dash');
			}
		} catch (err) {
			console.error('Reset error:', err);
			toast.error('Network error while resetting Digital Dash');
		} finally {
			resetting = false;
		}
	}
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
							{#each recovery.issues as issue, index (index)}
								<li class="break-words leading-snug text-red-800">• {issue}</li>
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
			<Button
				size="sm"
				onclick={resetDigitalDash}
				disabled={resetting}
				class="h-7 justify-start bg-orange-600 px-2 text-xs text-white hover:bg-orange-700 disabled:bg-orange-400"
			>
				<span class="mr-1 h-3 w-3" class:animate-spin={resetting}>
					<RotateCcw class="h-3 w-3" />
				</span>
				{resetting ? 'Resetting...' : 'Reset Digital Dash'}
			</Button>
		</div>
	</Alert>
{/if}
