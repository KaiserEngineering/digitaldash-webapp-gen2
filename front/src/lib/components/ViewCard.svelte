<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import GaugeComponent from './GaugeComponent.svelte';
	import toast from 'svelte-5-french-toast';
	import { cn } from '$lib/utils';
	import { Settings } from 'lucide-svelte';
	import { page } from '$app/state';

	let { view, index, class: className = '', pids = [] } = $props();

	const imageHandler = new ImageHandler();
	let loading = $state(true);
	let backgroundUrl = $state('');
	let theme: Record<string, string> = $state({});
	let failedImages: Record<string, boolean> = $state({});

	function handleImageError(themeKey: string) {
		failedImages = { ...failedImages, [themeKey]: true };
	}

	$effect(() => {
		if (!view) return;

		let timeoutId: number;

		const loadImages = async () => {
			loading = true;

			// Load background
			try {
				if (view.background) {
					const imageData = await imageHandler.loadImage(view.background);
					backgroundUrl = imageData.url;
					if (view.textColor !== 'white') {
						view.textColor = 'white';
					}
				}
			} catch (error) {
				console.warn(`Failed to load background "${view.background}":`, error);
				toast.error(`Failed to load background: ${(error as Error).message}`);
				backgroundUrl = '';
			}

			// Load themes
			try {
				const gauges = view.gauge ?? [];
				const themePromises = gauges.map(
					async (gauge: { theme: string; pid: string; units: string }) => {
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
					}
				);

				await Promise.allSettled(themePromises);
				theme = { ...theme };
				failedImages = { ...failedImages };
			} catch (error) {
				console.warn('Failed to load themes:', error);
			}

			loading = false;
		};

		// Debounce to prevent rapid reloads during rapid config changes
		timeoutId = setTimeout(loadImages, 100);

		return () => clearTimeout(timeoutId);
	});

	const showGearIcon = $derived(page.url.pathname === '/');
</script>

<div class={cn('group', className)}>
	{#if loading}
		<div class="m-1 sm:m-2">
			<div class="relative h-32 w-full overflow-hidden rounded-2xl sm:h-52">
				<Skeleton class="absolute inset-0 h-full w-full rounded-2xl" />
				<div class="relative z-10 flex h-full items-center justify-center gap-2 px-2 sm:gap-8 sm:px-4">
					{#each [0, 1, 2] as i}
						<div class="flex flex-col items-center gap-2">
							<Skeleton class="h-16 w-16 rounded-full sm:h-20 sm:w-20" style="animation-delay: {i * 150}ms" />
							<Skeleton class="h-3 w-12 rounded" style="animation-delay: {i * 150 + 75}ms" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<a href="/view/{index}" class="m-1 block">
			<div
				class={`relative h-32 w-full overflow-visible rounded-2xl border-2 shadow-md transition-all duration-500 ease-out sm:h-52 ${
					view.enable === 'Enabled'
						? 'hover:border-primary-500/50 border-transparent hover:scale-[1.02] hover:shadow-xl'
						: 'border-border opacity-60 grayscale hover:opacity-80'
				}`}
				style="background-image: url('{backgroundUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;"
			>
				{#if showGearIcon}
					<div class="absolute top-2 right-2 z-20">
						<Settings class="text-white/80 transition hover:scale-110 hover:text-white" size="20" />
					</div>
				{/if}

				{#if view.enable !== 'Enabled'}
					<div class="absolute top-2 left-2 z-20">
						<div
							class="bg-muted/90 text-muted-foreground border-border/50 rounded-md border px-2 py-1 text-xs font-medium"
						>
							Disabled
						</div>
					</div>
				{/if}
				<div class="absolute inset-0 rounded-2xl bg-black/10"></div>

				<div class="relative z-10 flex h-full items-center justify-center px-2 sm:px-4">
					<div class="flex w-full items-center justify-center gap-2 px-1 sm:gap-8 sm:px-2">
						{#each [0, 1, 2] as i (i)}
							{@const gauge = view?.gauge?.[i] ?? {}}
							{@const isEnabled = i < view.num_gauges}
							{#if isEnabled}
								<div class="flex flex-col items-center justify-center px-0.5 sm:px-1">
									<GaugeComponent
										{gauge}
										themeUrl={theme[gauge.theme]}
										failed={failedImages[gauge.theme]}
										textColor={view.textColor}
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
