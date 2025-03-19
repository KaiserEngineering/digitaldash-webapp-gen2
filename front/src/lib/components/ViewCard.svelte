<script lang="ts">
	import { onMount } from 'svelte';
	import Spinner from './Spinner.svelte';
	import { ImageHandler } from '$lib/imageHandler.svelte';
	import { Gauge as GaugeIcon } from 'lucide-svelte';
	import toast from 'svelte-5-french-toast';
	import { ConfigStore } from '$lib/config.svelte';

	// Import types and schema from our Zod schemas file
	import type { ViewType } from '$schemas/digitaldash';
	import { ViewSchema } from '$schemas/digitaldash';

	// Retrieve props via $props()
	let { view, index } = $props<{ view: ViewType; index: number }>();

	// Optionally validate the incoming view prop
	const parsed = ViewSchema.safeParse(view);
	if (!parsed.success) {
		toast.error('Invalid view data');
		console.error('Invalid view data', parsed.error);
	}

	const gauges = ConfigStore.config
		? ConfigStore.config.gauge.filter((g) => g.index === index)
		: [];

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	let backgroundUrl = $state('');

	// Compute ideal text color based on image brightness
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

	// Store theme images keyed by theme name
	const theme: Record<string, string> = {};
	let failedImages: Record<string, boolean> = $state({});

	function handleImageError(themeKey: string) {
		failedImages = { ...failedImages, [themeKey]: true };
	}

	onMount(async () => {
		try {
			const imageData = await imageHandler.loadImage(view.background);
			backgroundUrl = imageData.url;
			view.textColor = await computeIdealTextColor(imageData.url);

			// If your view contains gauges and you load their images:
			const fetchedThemes = new Set<string>();
			// Assuming you have a corresponding property for gauge themes
			// (You might need to adapt this part if your view structure differs)
			for (const gauge of gauges || []) {
				if (!theme[gauge.theme] && !fetchedThemes.has(gauge.theme)) {
					fetchedThemes.add(gauge.theme);
					const themeImageData = await imageHandler.loadImage(`${gauge.theme}.png`);
					theme[gauge.theme] = themeImageData.url;
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
	<a href="/view/{index}">
		<div
			class="view-card mb-2 rounded-3xl bg-cover p-2 shadow-lg"
			style:background-image={`url('${backgroundUrl}')`}
		>
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold" style:color={view.textColor}>
					{view.name || `View ${index + 1}`}
				</h2>
			</div>
			<div class="flex justify-center space-x-2">
				{#each gauges as gauge}
					<div class="flex flex-col items-center">
						<div class="relative h-24 w-24">
							{#if !failedImages[gauge.theme]}
								<img
									class="rounded-full"
									src={theme[gauge.theme]}
									alt={gauge.theme}
									onerror={() => handleImageError(gauge.theme)}
								/>
							{/if}
							{#if failedImages[gauge.theme]}
								<!-- Show GaugeIcon only if the image fails -->
								<div class="absolute inset-0 flex items-center justify-center">
									<GaugeIcon class="text-white" />
								</div>
							{/if}
						</div>
						<span class="mt-2 rounded-full bg-purple-600 px-4 py-1 text-sm text-white">
							{gauge.name}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</a>
{/if}
