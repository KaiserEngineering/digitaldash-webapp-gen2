<script lang="ts">
	import { Trash2, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { ImageHandler } from '$lib/image/handler';
	import { onMount } from 'svelte';
	import FileUploaderExplorer from './FileUploaderExplorer.svelte';
	import Spinner from './Spinner.svelte';
	import toast from 'svelte-5-french-toast';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let {
		imageNames = [],
		editable = true,
		deleteCallback = () => {},
		uploadBackground = () => {}
	} = $props();

	const imageHandler = new ImageHandler();

	let failedImages = $state<Record<string | number, boolean>>({});
	let loadedImages = $state<Record<string | number, string | null>>({});
	let loadingStates = $state<Record<string | number, boolean>>({});
	let deletingStates = $state<Record<string | number, boolean>>({});
	let uploadingStates = $state<Record<string | number, boolean>>({});

	function handleImageError(key: string | number) {
		// Don't mark as failed if we're currently uploading - it's just the old image failing
		if (uploadingStates[key]) {
			return;
		}
		failedImages[key] = true;
		loadedImages[key] = null;
		loadingStates[key] = false;
	}

	async function reloadImageSlot(imageName: string) {
		// Always try to load the image (don't toggle)
		loadingStates[imageName] = true;
		failedImages[imageName] = false;

		try {
			const image = await imageHandler.loadImage(imageName);
			loadedImages[imageName] = image?.url ?? null;

			if (!image?.url) {
				failedImages[imageName] = true;
			}
		} catch (err) {
			console.warn(`Failed to reload image: ${imageName}`, err);
			failedImages[imageName] = true;
			loadedImages[imageName] = null;
		}

		loadingStates[imageName] = false;
	}

	async function handleDelete(imageName: string) {
		deletingStates[imageName] = true;

		try {
			await deleteCallback(imageName);
			await reloadImageSlot(imageName);
			toast.success(`${imageName} deleted successfully`);
		} catch (error) {
			console.error('Delete failed:', error);
			toast.error(`Failed to delete ${imageName}`);
		} finally {
			deletingStates[imageName] = false;
		}
	}

	async function handleUploadSuccess(imageName: string) {
		uploadingStates[imageName] = true;

		toast.success(`${imageName} uploaded successfully`);
		imageHandler.clearCache(imageName);
		await reloadImageSlot(imageName);

		uploadingStates[imageName] = false;
	}

	onMount(() => {
		imageNames.forEach(async (imageName) => {
			loadingStates[imageName] = true;

			try {
				const image = await imageHandler.loadImage(imageName);
				loadedImages[imageName] = image?.url ?? null;
			} catch {
				failedImages[imageName] = true;
			}

			loadingStates[imageName] = false;
		});
	});
</script>

{#if imageNames && imageNames.length > 0}
	<div class="grid grid-cols-1 gap-6">
		{#each imageNames as imageName (imageName)}
			<div class="flex flex-col">
				{#if loadingStates[imageName]}
					<div
						class="border-border bg-muted flex h-40 items-center justify-center rounded-lg border-2 border-dashed"
					>
						<Loader2 class="text-muted-foreground h-6 w-6 animate-spin" />
					</div>
				{:else if failedImages[imageName] || !loadedImages[imageName]}
					<div
						class="relative"
						in:fade={{ duration: 300, easing: quintOut }}
						out:scale={{ duration: 200, easing: quintOut }}
					>
						<FileUploaderExplorer
							uploadCallback={uploadBackground}
							slotName={imageName}
							onUploaded={() => handleUploadSuccess(imageName)}
						/>

					</div>
				{:else}
					<div
						class="group bg-card border-border relative overflow-hidden rounded-lg border transition-all hover:shadow-md"
						in:scale={{ duration: 300, easing: quintOut }}
						out:fade={{ duration: 200, easing: quintOut }}
					>
						<div class="m-2">
							<img
								src={loadedImages[imageName] || '/placeholder.svg'}
								alt="{imageName} background"
								loading="lazy"
								class="w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
								onerror={() => handleImageError(imageName)}
							/>
						</div>

						{#if editable}
							<div
								class="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/10"
							>
								<div
									class="absolute top-2 right-2 flex gap-2 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-0"
								>
									<Button
										variant="destructive"
										size="icon"
										class="h-8 w-8 rounded-full bg-destructive/90 shadow-md hover:bg-destructive"
										onclick={() => handleDelete(imageName)}
										disabled={deletingStates[imageName]}
									>
										{#if deletingStates[imageName]}
											<Loader2 class="h-4 w-4 animate-spin text-destructive-foreground" />
										{:else}
											<Trash2 class="h-4 w-4 text-destructive-foreground" />
										{/if}
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-12">
		<Spinner />
		<p class="text-muted-foreground mt-4">Loading image slots...</p>
	</div>
{/if}
