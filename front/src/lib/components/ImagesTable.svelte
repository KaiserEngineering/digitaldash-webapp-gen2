<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import { Button } from '@/components/ui/button';

	let { images, editable = true, deleteCallback = () => {} } = $props();

	// Track which images failed to load
	let failedImages: { [key: string]: boolean } = {};

	// Handle image load errors
	function handleImageError(key: string) {
		failedImages[key] = true;
	}
</script>

{#if images && Object.keys(images).length > 0}
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each Object.keys(images) as key}
			{@const image = images[key]}
			<div
				class="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg"
			>
				<div class="aspect-square w-full overflow-hidden">
					{#if failedImages[key]}
						<div class="flex h-full w-full items-center justify-center bg-gray-100 p-4 text-center">
							<p class="text-sm font-medium text-gray-500">{key}</p>
						</div>
					{:else}
						<img
							src={image.url || '/placeholder.svg'}
							alt={key}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							onerror={() => handleImageError(key)}
						/>
					{/if}
				</div>
				<div class="p-3">
					<p class="truncate text-sm font-medium text-gray-700">{key}</p>
				</div>
				{#if editable}
					<div
						class="absolute right-2 top-2 opacity-100 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-0"
					>
						<Button
							variant="destructive"
							size="icon"
							class="h-8 w-8 rounded-full bg-red-500/90 shadow-md hover:bg-red-600"
							onclick={() => deleteCallback(key)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div
		class="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center"
	>
		<div class="rounded-full bg-gray-100 p-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
		</div>
		<p class="mt-4 text-sm font-medium text-gray-500">No images found</p>
	</div>
{/if}
