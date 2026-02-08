<script lang="ts">
	import { configErrorStore } from '$lib/stores/configStore';
	import { TriangleAlert, X } from 'lucide-svelte';

	const error = $derived($configErrorStore);

	function dismissError() {
		configErrorStore.set(null);
	}
</script>

{#if error}
	<div class="border-b border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3">
		<div class="container mx-auto flex items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				<TriangleAlert class="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="text-foreground font-semibold">Configuration Validation Warning</h3>
					<p class="text-foreground/90 mt-1 text-sm">
						{error.message}
					</p>
				</div>
			</div>
			<button
				onclick={dismissError}
				class="text-foreground hover:bg-muted cursor-pointer rounded-full p-1 transition-colors duration-200"
				aria-label="Dismiss"
			>
				<X class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}
