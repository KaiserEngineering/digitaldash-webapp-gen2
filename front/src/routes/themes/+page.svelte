<!-- src/routes/+page.svelte -->
<script lang="ts">
	// Import UI components
	import FileUploaderExplorer from '@/components/FileUploaderExplorer.svelte';
	import ImagesTable from '@/components/ImagesTable.svelte';
	import type { PageProps } from './$types';

	// For SvelteKit, you may receive data from your load function.
	// (Depending on your SvelteKit version you might use the $page store.)
	let { data }: PageProps = $props();

	// Initialize a reactive object for customer images.
	// (If your load function returns an array, consider converting it into an object keyed by filename.)
	let customerImages: { [key: string]: any } = $state(data?.customerImages || {});
</script>

<!-- File uploader area -->
<div class="mx-auto w-1/2">
	<FileUploaderExplorer bind:images={customerImages} />
</div>

<!-- Render Customer Images -->
<h2 class="mt-4 text-xl font-semibold">Customer Images</h2>
<ImagesTable images={customerImages} />

<!-- Render Factory Images -->
<h2 class="mt-4 text-xl font-semibold">Factory Images</h2>
<!-- Assuming factoryImages is provided via the page data;
     here we render them in non-editable mode -->
<ImagesTable images={data?.factoryImages || {}} editable={false} />
