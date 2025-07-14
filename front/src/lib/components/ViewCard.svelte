<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import Spinner from './Spinner.svelte';
	import GaugeComponent from './GaugeComponent.svelte';
	import toast from 'svelte-5-french-toast';
	import { ViewSchema } from '$schemas/digitaldash';
	import { cn } from '$lib/utils';
	import { computeIdealTextColor } from '$lib/utils/imageProcessor';

	let { view, index, class: className = '' } = $props();

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	let backgroundUrl = $state('');
	const theme: Record<string, string> = $state({});
	let failedImages: Record<string, boolean> = $state({});
	let prevBackground: string | undefined = undefined;

	function handleImageError(themeKey: string) {
		failedImages = { ...failedImages, [themeKey]: true };
	}


	$effect(() => {
		if (!view) return;

		const currentBackground = view.background;
		const currentGauges = view.gauge;

		(async () => {
			loading = true;

			try {
				// Only reload background if it changed
				if (backgroundUrl === '' || currentBackground !== prevBackground) {
					const imageData = await imageHandler.loadImage(currentBackground);
					backgroundUrl = imageData.url;
					try {
						view.textColor = await computeIdealTextColor(imageData.url);
					} catch (error) {
						console.warn('Failed to compute text color, using fallback:', error);
						view.textColor = 'white';
					}
					prevBackground = currentBackground;
				}

				const gauges = currentGauges ?? [];
				for (const gauge of gauges) {
					const key = `${gauge.theme}`;
					if (!theme[key] && !failedImages[key]) {
						const themeImageData = await imageHandler.loadTheme(key);
						theme[key] = themeImageData.url;
					}
				}
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
								<div class="flex h-full max-h-32 flex-col items-center justify-between px-2">
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
