<script lang="ts">
	import { Trash2, Loader2, RefreshCw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { ImageHandler } from '$lib/image/handler';
	import { onMount } from 'svelte';
	import FileUploaderExplorer from './FileUploaderExplorer.svelte';
	import Spinner from './Spinner.svelte';
	import toast from 'svelte-5-french-toast';

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

	function handleImageError(key: string | number) {
		failedImages[key] = true;
		loadedImages[key] = null;
		loadingStates[key] = false;
	}

	async function reloadImageSlot(imageName: string) {
		// If currently showing an image, flip to uploader
		if (loadedImages[imageName]) {
			failedImages[imageName] = true;
			loadedImages[imageName] = null;
			loadingStates[imageName] = false;
		}
		// If currently showing uploader, try to load the image
		else {
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
		toast.success(`${imageName} uploaded successfully`);
		await reloadImageSlot(imageName);
	}

	onMount(() => {
		imageNames.forEach(async (imageName) => {
			loadingStates[imageName] = true;

			try {
				const image = await imageHandler.loadImage(imageName);
				loadedImages[imageName] = image?.url ?? null;
			} catch (err) {
				failedImages[imageName] = true;
			}

			loadingStates[imageName] = false;
		});
	});
</script>

{#if imageNames && imageNames.length > 0}
	<div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
		{#each imageNames as imageName}
			<div class="flex flex-col">
				<h3 class="mb-3 text-sm font-medium text-gray-700 capitalize">
					{imageName.replace('-', ' ')}
				</h3>

				{#if loadingStates[imageName]}
					<div
						class="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100"
					>
						<Loader2 class="h-6 w-6 animate-spin text-gray-400" />
					</div>
				{:else if failedImages[imageName] || !loadedImages[imageName]}
					<div class="relative">
						<FileUploaderExplorer
							uploadCallback={uploadBackground}
							slotName={imageName}
							onUploaded={() => handleUploadSuccess(imageName)}
						/>

						{#if editable}
							<div class="absolute top-2 right-2 z-10 flex gap-2">
								<Button
									variant="secondary"
									size="icon"
									class="h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white"
									onclick={() => reloadImageSlot(imageName)}
									disabled={loadingStates[imageName]}
								>
									<RefreshCw class="h-4 w-4" />
								</Button>
							</div>
						{/if}
					</div>
				{:else}
					<div
						class="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md"
					>
						<div class="aspect-video w-full overflow-hidden">
							<img
								src={loadedImages[imageName] || '/placeholder.svg'}
								alt="{imageName} background"
								loading="lazy"
								class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
										variant="secondary"
										size="icon"
										class="h-8 w-8 rounded-full bg-white/90 shadow-md hover:bg-white"
										onclick={() => reloadImageSlot(imageName)}
										disabled={loadingStates[imageName]}
									>
										<RefreshCw class="h-4 w-4" />
									</Button>

									<Button
										variant="destructive"
										size="icon"
										class="h-8 w-8 rounded-full bg-red-500/90 shadow-md hover:bg-red-600"
										onclick={() => handleDelete(imageName)}
										disabled={deletingStates[imageName]}
									>
										{#if deletingStates[imageName]}
											<Loader2 class="h-4 w-4 animate-spin" />
										{:else}
											<Trash2 class="h-4 w-4" />
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
		<p class="mt-4 text-gray-500">Loading image slots...</p>
	</div>
{/if}
