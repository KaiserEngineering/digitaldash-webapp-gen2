<!-- src/routes/+page.svelte -->
<script lang="ts">
	// Import UI components
	import FileUploaderExplorer from '@/components/FileUploaderExplorer.svelte';
	import ImagesTable from '@/components/ImagesTable.svelte';
	import type { PageProps } from './$types';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';

	// For SvelteKit, you may receive data from your load function.
	let { data }: PageProps = $props();

	// Initialize a reactive object for customer images.
	let customerImages: { [key: string]: any } = $state(data?.customerImages || {});
	// Create a wrapper function to ensure reactivity
	async function handleUpload(file: File): Promise<void> {
		await uploadBackground(file, customerImages);
		// Force reactivity by creating a new object
		customerImages = { ...customerImages };
	}
</script>

<h1 class="text-2xl font-semibold">Background Images</h1>

<!-- File uploader area -->
<div class="mx-auto w-full lg:w-1/2">
	<FileUploaderExplorer uploadCallback={handleUpload} />
</div>

<!-- Render Customer Images -->
<h2 class="mt-4 text-xl font-semibold">Customer Images</h2>
<ImagesTable
	images={customerImages}
	deleteCallback={(filename: string) => deleteBackground(filename, customerImages)}
/>

<!-- Render Factory Images -->
<h2 class="mt-4 text-xl font-semibold">Factory Images</h2>
<!-- Assuming factoryImages is provided via the page data;
     here we render them in non-editable mode -->
<ImagesTable images={data?.factoryImages} editable={false} />
