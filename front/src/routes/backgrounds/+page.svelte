<!-- src/routes/+page.svelte -->
<script lang="ts">
	import FileUploaderExplorer from '@/components/FileUploaderExplorer.svelte';
	import ImagesTable from '@/components/ImagesTable.svelte';
	import type { PageProps } from './$types';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';
	import Spinner from '@/components/Spinner.svelte';
	import { ImageHandler } from '@/image/handler';
	import { onMount } from 'svelte';
	import { ImageIcon } from 'lucide-svelte';
	import PageCard from '@/components/PageCard.svelte';

	let { data }: PageProps = $props();

	const imageHandler = new ImageHandler();

	let customerImages: { [key: string]: any } = $state({});
	let factoryImages: { [key: string]: any } = $state({});

	async function handleUpload(file: File): Promise<void> {
		await uploadBackground(file, customerImages);

		customerImages = { ...customerImages };
	}

	let factoryLoadPromise: Promise<any> = $state(Promise.resolve());
	let customerLoadPromise: Promise<any> = $state(Promise.resolve());

	onMount(() => {
		factoryLoadPromise = Promise.all(
			data.factoryImageNames.map((name) => imageHandler.loadImage(name))
		).then((arr) => {
			const images = Object.fromEntries(arr.map((img) => [img.name, img]));
			factoryImages = images;
			return images;
		});

		customerLoadPromise = Promise.all(
			data.customerImageNames.map((name) => imageHandler.loadImage(name))
		).then((arr) => {
			const images = Object.fromEntries(arr.map((img) => [img.name, img]));
			customerImages = images;
			return images;
		});
	});
</script>

<PageCard title="Backgrounds" description="Add custom backgrounds!." icon={ImageIcon}>
	{#snippet children()}
		<div class="mx-auto w-full lg:w-1/2">
			<FileUploaderExplorer uploadCallback={handleUpload} />
		</div>

		<div class="flex flex-col items-center justify-center">
			{#await customerLoadPromise}
				<Spinner class="m-2" />
			{:then}
				<h2 class="mt-4 text-xl font-semibold">User Images</h2>
				<ImagesTable
					images={customerImages}
					deleteCallback={(filename: string) => deleteBackground(filename, customerImages)}
				/>
			{/await}

			{#await factoryLoadPromise}
				<Spinner class="m-2" />
			{:then}
				<h2 class="mt-4 text-xl font-semibold">Factory Images</h2>
				<ImagesTable images={factoryImages} editable={false} />
			{/await}
		</div>
	{/snippet}

	{#snippet footerContent()}
		<div></div>
	{/snippet}
</PageCard>
