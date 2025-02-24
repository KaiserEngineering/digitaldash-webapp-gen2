<script lang="ts">
	import { onMount } from 'svelte';
	import Spinner from './Spinner.svelte';
	import { ImageHandler } from '$lib/imageHandler.svelte';
	import { Gauge as GaugeIcon } from 'lucide-svelte';
	import { apiUrl } from '@/config';
	import toast from 'svelte-5-french-toast';
	import type { string } from 'zod';

	// Define the Theme type
	type Theme = string;

	// Define the types for gauges and views
	type Gauge = {
		id: string;
		label: string;
		theme: string;
		pid: string;
		enabled: boolean;
		unit?: string;
	};

	type View = {
		id: string;
		name: string;
		enabled: boolean;
		background: string;
		gauges: Gauge[];
		textColor?: string;
	};

	let { view }: { view: View } = $props();

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	// This will store the URL returned from the ImageHandler.
	let backgroundUrl = $state('');

	/**
	 * Compute the ideal text color based on the background image brightness.
	 * Loads the image (using the provided URL) and computes the average brightness
	 * using a canvas. If the brightness is low, returns 'white'; otherwise 'black'.
	 */
	async function computeIdealTextColor(imageUrl: string): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'Anonymous';
			img.src = imageUrl;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					let total = 0;
					for (let i = 0; i < imageData.data.length; i += 4) {
						// Average of R, G, B values for brightness
						const brightness =
							(imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
						total += brightness;
					}
					const avgBrightness = total / (canvas.width * canvas.height);
					resolve(avgBrightness < 128 ? 'white' : 'black');
				} else {
					resolve('black');
				}
			};
			img.onerror = () => resolve('black');
		});
	}

	let theme: Record<string, Theme> = $state({});
	onMount(async () => {
		try {
			// Load the image via the ImageHandler (this handles caching and endpoint selection)
			const imageData = await imageHandler.loadImage(`background/${view.background}`);
			backgroundUrl = imageData.url;

			// Compute ideal text color based on the loaded image
			view.textColor = await computeIdealTextColor(imageData.url);

			// Set to store already fetched themes
			const fetchedThemes = new Set<string>();

			for (const gauge of view.gauges) {
				if (!theme[gauge.theme] && !fetchedThemes.has(gauge.theme)) {
					fetchedThemes.add(gauge.theme);

					const themeImageData = await imageHandler.loadImage(`${gauge.theme}.png.gz`);
					const themeURL = themeImageData.url;

					theme[gauge.theme] = themeURL;
				}
			}
		} catch (error) {
			toast.error(`Failed to load view image: ${(error as Error).message}`);
			view.textColor = 'black';
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="flex h-32 items-center justify-center">
		<Spinner />
	</div>
{:else}
	<div
		class="view-card rounded-3xl bg-cover p-2 shadow-lg"
		style:background-image={`url('${backgroundUrl}')`}
	>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-bold" style:color={view.textColor}>{view.name}</h2>
		</div>

		<div class="flex justify-center space-x-2">
			{#each view.gauges as gauge}
				<div class="flex flex-col items-center">
					<div class="relative h-24 w-24">
						<img class="rounded-full" src={theme[gauge.theme]} alt={gauge.theme} />
						<div class="absolute inset-0 flex items-center justify-center">
							<GaugeIcon class="text-white" />
						</div>
					</div>
					<span class="mt-2 rounded-full bg-purple-600 px-4 py-1 text-sm text-white">
						{gauge.label}
					</span>
					<span class="text-xs text-white">
						{gauge.pid}{gauge.unit ? ` (${gauge.unit})` : ''}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
