<!-- src/routes/+page.svelte -->
<script lang="ts">
	// Import UI components
	import FileUploaderExplorer from '@/components/FileUploaderExplorer.svelte';
	import ImagesTable from '@/components/ImagesTable.svelte';
	import type { PageProps } from './$types';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';
	import { ImageHandler } from '$lib/imageHandler.svelte';
	import Spinner from '@/components/Spinner.svelte';

	// For SvelteKit, you may receive data from your load function.
	let { data }: PageProps = $props();

	// Initialize a reactive object for customer images.
	let customerImages: { [key: string]: any } = $state({});
	let factoryImages: { [key: string]: any } = $state({});
	let imageHandler = new ImageHandler();

	// Lazy load customer images
	async function loadCustomerImages() {
		const imagesData: { [key: string]: any } = {};
		console.log(data.factoryImageNames);
		await Promise.all(
			data.customerImageNames.map(async (name: string) => {
				try {
					imagesData[name] = await imageHandler.loadImage(name);
				} catch (err) {
					console.error(`Failed to load customer image: ${name}`, err);
				}
			})
		);
		customerImages = imagesData;
	}

	// Lazy load factory images
	async function loadFactoryImages() {
		const imagesData: { [key: string]: any } = {};
		await Promise.all(
			data.factoryImageNames.map(async (name: string) => {
				try {
					imagesData[name] = await imageHandler.loadImage(name);
				} catch (err) {
					console.error(`Failed to load factory image: ${name}`, err);
				}
			})
		);
		factoryImages = imagesData;
	}

	// Create a wrapper function to ensure reactivity
	async function handleUpload(file: File): Promise<void> {
		await uploadBackground(file, customerImages);
		// Force reactivity by creating a new object
		customerImages = { ...customerImages };
	}

	const factoryLoadPromise = loadFactoryImages();
	const customerLoadPromise = loadCustomerImages();
</script>

<h1 class="text-2xl font-semibold">Background Images</h1>

<!-- File uploader area -->
<div class="mx-auto w-full lg:w-1/2">
	<FileUploaderExplorer uploadCallback={handleUpload} />
</div>

<div class="flex flex-col items-center justify-center">
	{#await customerLoadPromise}
		<Spinner classNames="m-2"/>
	{:then}
		<!-- Render Customer Images -->
		<h2 class="mt-4 text-xl font-semibold">User Images</h2>
		<ImagesTable
			images={customerImages}
			deleteCallback={(filename: string) => deleteBackground(filename, customerImages)}
		/>
	{/await}

	{#await factoryLoadPromise}
		<Spinner />
	{:then}
		<!-- Render Factory Images -->
		<h2 class="mt-4 text-xl font-semibold">Factory Images</h2>
		<!-- Assuming factoryImages is provided via the page data;
     here we render them in non-editable mode -->
		<ImagesTable images={factoryImages} editable={false} />
	{/await}
</div>
