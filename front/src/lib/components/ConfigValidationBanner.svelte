<script lang="ts">
	import { configErrorStore } from '$lib/stores/configStore';
	import { TriangleAlert, X } from 'lucide-svelte';

	const error = $derived($configErrorStore);

	function dismissError() {
		configErrorStore.set(null);
	}
</script>

{#if error}
	<div
		class="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20"
	>
		<div class="container mx-auto flex items-start justify-between gap-3">
			<div class="flex items-start gap-3">
				<TriangleAlert class="mt-0.5 h-5 w-5 flex-shrink-0" />
				<div class="flex-1">
					<h3 class="font-semibold">Configuration Validation Warning</h3>
					<p class="mt-1 text-sm">
						{error.message}
					</p>
				</div>
			</div>
			<button
				onclick={dismissError}
				class="cursor-pointer rounded-full p-1 transition-colors duration-200"
				aria-label="Dismiss"
			>
				<X class="h-5 w-5" />
			</button>
		</div>
	</div>
{/if}
