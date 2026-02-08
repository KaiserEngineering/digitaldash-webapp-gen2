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
	<Alert class="flex flex-col border-[var(--color-error-border)] bg-[var(--color-error-bg)] p-3">
		<!-- Technical details toggle -->
		{#if recovery.issues.length > 0}
			<div class="mb-1 sm:mb-2 sm:ml-4">
				<button
					onclick={() => (showDetails = !showDetails)}
					class="text-destructive hover:text-destructive/90 flex items-center gap-1 py-1 text-xs transition-colors"
				>
					{#if showDetails}
						<ChevronDown class="h-3 w-3" />
					{:else}
						<ChevronRight class="h-3 w-3" />
					{/if}
					<span>Details ({recovery.issues.length})</span>
				</button>

				{#if showDetails}
					<div class="mt-1 rounded bg-[var(--color-error-bg)] p-2 text-xs">
						<ul class="space-y-1">
							{#each recovery.issues as issue, index (index)}
								<li class="text-destructive leading-snug break-words">• {issue}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Action buttons -->
		<div class="mt-2 flex w-full flex-col gap-2 sm:ml-4 sm:flex-row">
			<Button
				size="sm"
				href="/firmware/web"
				variant="outline"
				class="h-8 justify-start px-3 text-xs font-medium"
				data-sveltekit-preload-data="off"
			>
				<Upload class="mr-1.5 h-3.5 w-3.5" />
				Update Web App
			</Button>
			<Button
				size="sm"
				href="/firmware/stm"
				variant="outline"
				class="h-8 justify-start px-3 text-xs font-medium"
				data-sveltekit-preload-data="off"
			>
				<Smartphone class="mr-1.5 h-3.5 w-3.5" />
				Update DigitalDash
			</Button>
			<Button
				size="sm"
				onclick={resetDigitalDash}
				disabled={resetting}
				variant="secondary"
				class="h-8 justify-start px-3 text-xs font-medium"
			>
				<RotateCcw class={`mr-1.5 h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
				{resetting ? 'Resetting...' : 'Reset Device'}
			</Button>
		</div>
	</Alert>
{/if}
