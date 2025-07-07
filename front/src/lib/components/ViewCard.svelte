<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import Spinner from './Spinner.svelte';
	import GaugeComponent from './GaugeComponent.svelte';
	import toast from 'svelte-5-french-toast';
	import { ViewSchema } from '$schemas/digitaldash';
	import { cn } from '$lib/utils';

	let { view, index, class: className = '' } = $props();

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	let backgroundUrl = $state('');
	const theme: Record<string, string> = $state({});
	let failedImages: Record<string, boolean> = $state({});

	function handleImageError(themeKey: string) {
		failedImages = { ...failedImages, [themeKey]: true };
	}

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

	$effect(() => {
		(async () => {
			loading = true;

			try {
				const parsed = ViewSchema.safeParse(view);
				if (!parsed.success) {
					toast.error('Invalid view data');
					console.error('Invalid view data', parsed.error);
					return;
				}

				try {
					const imageData = await imageHandler.loadImage(view.background);
					backgroundUrl = imageData.url;
					view.textColor = await computeIdealTextColor(imageData.url);
				} catch (err) {
					toast.error(`Failed to load background: ${(err as Error).message}`);
					backgroundUrl = '';
					view.textColor = 'white';
				}

				const gauges = view?.gauge ?? [];
				await Promise.all(
					gauges.map(async (gauge: { theme: string | number }) => {
						const key = `${gauge.theme}`;
						if (!theme[key]) {
							try {
								const themeImageData = await imageHandler.loadTheme(key);
								theme[key] = themeImageData.url;
							} catch (err) {
								failedImages = { ...failedImages, [key]: true };
								console.debug(`Failed to load theme image for "${key}":`, err);
							}
						}
					})
				);
			} catch (error) {
				toast.error(`Failed to load view: ${(error as Error).message}`);
				view.textColor = 'white';
			} finally {
				loading = false;
			}
		})();
	});
</script>

<div class={cn('group', className)}>
	{#if loading}
		<div
			class="bg-primary-200 border-primary-200 flex h-36 items-center justify-center rounded-2xl border"
		>
			<Spinner />
		</div>
	{:else}
		<a href="/view/{index}" class="block">
			<div
				class="hover:border-primary-500/50 relative h-36 w-full overflow-hidden rounded-2xl border-2 border-transparent bg-cover shadow-md transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-xl"
				style:background-image={`url('${backgroundUrl}')`}
			>
				<div class="absolute inset-0 rounded-2xl bg-black/10"></div>

				<div class="relative z-10 flex h-full items-center justify-center px-6">
					<div class="flex w-full items-center justify-center gap-6 px-4">
						{#each Array(3) as _, i}
							{@const gauge = view?.gauge?.[i] ?? {}}
							{@const isEnabled = i < view.num_gauges}
							{#if isEnabled}
								<div class="flex flex-col items-center justify-between h-full max-h-32 px-2">
									<GaugeComponent
										{gauge}
										gaugeIndex={i}
										themeUrl={theme[gauge.theme]}
										failed={failedImages[gauge.theme]}
										textColor={view.textColor}
										onImageError={() => handleImageError(gauge.theme)}
									/>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		</a>
	{/if}
</div>
