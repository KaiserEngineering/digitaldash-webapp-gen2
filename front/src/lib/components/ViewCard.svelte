<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import Spinner from './Spinner.svelte';
	import GaugeComponent from './GaugeComponent.svelte';
	import toast from 'svelte-5-french-toast';
	import { cn } from '$lib/utils';
	import { computeIdealTextColor } from '$lib/utils/imageProcessor';
	import { Settings } from 'lucide-svelte';
	import { page } from '$app/state';

	let { view, index, class: className = '', pids = [] } = $props();

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	let backgroundUrl = $state('');
	let theme: Record<string, string> = $state({});
	let failedImages: Record<string, boolean> = $state({});
	let prevBackground: string | undefined = undefined;

	function handleImageError(themeKey: string) {
		failedImages = { ...failedImages, [themeKey]: true };
	}

	$effect(() => {
		if (!view) return;

		const currentBackground = view.background;
		const currentGauges = view.gauge;

		// Debounce to prevent rapid reloads
		const timeoutId = setTimeout(async () => {
			loading = true;

			// Load background independently - failure won't affect theme loading
			try {
				// Only reload background if it changed
				if (backgroundUrl === '' || currentBackground !== prevBackground) {
					const imageData = await imageHandler.loadImage(currentBackground);
					backgroundUrl = imageData.url;
					// try {
					// 	view.textColor = await computeIdealTextColor(imageData.url);
					// } catch (error) {
					// 	console.warn('Failed to compute text color, using fallback:', error);
					// 	view.textColor = 'white';
					// }
					view.textColor = 'white';
					prevBackground = currentBackground;
				}
			} catch (error) {
				console.warn(`Failed to load background "${currentBackground}":`, error);
				toast.error(`Failed to load background: ${(error as Error).message}`);
				view.textColor = 'white';
				// Don't set backgroundUrl to empty - keep previous or use fallback
			}

			// Load themes independently - always attempt regardless of background status
			try {
				const gauges = currentGauges ?? [];
				const themePromises = gauges.map(async (gauge: { theme: any }) => {
					const key = `${gauge.theme}`;
					if (!theme[key] && !failedImages[key] && gauge.theme) {
						try {
							const themeImageData = await imageHandler.loadTheme(key);
							theme = { ...theme, [key]: themeImageData.url };
						} catch (error) {
							console.warn(`Failed to load theme "${key}":`, error);
							failedImages = { ...failedImages, [key]: true };
						}
					}
				});

				// Wait for all theme loads to complete
				await Promise.allSettled(themePromises);

				// Force reactive update by reassigning state objects
				theme = { ...theme };
				failedImages = { ...failedImages };
			} catch (error) {
				console.warn('Failed to load themes:', error);
				// Don't show toast for theme errors - they're handled individually
			}

			loading = false;
		}, 300); // 300ms debounce delay

		// Cleanup timeout on component unmount or effect re-run
		return () => clearTimeout(timeoutId);
	});

	const showGearIcon = $derived(page.url.pathname === '/');
</script>

<div class={cn('group', className)}>
	{#if loading}
		<div
			class="bg-primary-200 border-primary-200 m-1 flex h-48 items-center justify-center rounded-2xl border sm:m-2 sm:h-52"
		>
			<Spinner />
		</div>
	{:else}
		<a href="/view/{index}" class="m-1 block">
			<div
				class="hover:border-primary-500/50 relative h-20 w-full overflow-hidden rounded-2xl border-2 border-transparent bg-cover shadow-md transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-xl sm:h-52"
				style:background-image={`url('${backgroundUrl}')`}
			>
				{#if showGearIcon}
					<div class="absolute top-2 right-2 z-20">
						<Settings class="text-white/80 transition hover:scale-110 hover:text-white" size="20" />
					</div>
				{/if}
				<div class="absolute inset-0 rounded-2xl bg-black/10"></div>

				<div class="relative z-10 flex h-full items-center justify-center px-2 sm:px-4">
					<div class="flex w-full items-center justify-center gap-2 px-1 sm:gap-8 sm:px-2">
						{#each Array(3) as _, i}
							{@const gauge = view?.gauge?.[i] ?? {}}
							{@const isEnabled = i < view.num_gauges}
							{#if isEnabled}
								<div class="flex flex-col items-center justify-center px-0.5 sm:px-1">
									<GaugeComponent
										{gauge}
										gaugeIndex={i}
										themeUrl={theme[gauge.theme]}
										failed={failedImages[gauge.theme]}
										textColor={view.textColor}
										numGauges={view.num_gauges}
										{pids}
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
