<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import { Check, Image as ImageIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import Spinner from './Spinner.svelte';

	let {
		value = $bindable(''),
		options = [],
		onSelect = () => {},
		class: className = '',
		disabled = false,
		themes = false,
		label = ''
	} = $props();

	const imageHandler = new ImageHandler();

	let loading = $state(true);
	let imageUrls = $state<Record<string, string>>({});
	let failedImages = $state<Record<string, boolean>>({});

	async function loadImagePreviews() {
		loading = true;

		const loadPromises = options.map(async (option) => {
			try {
				const imageData = themes
					? await imageHandler.loadTheme(option)
					: await imageHandler.loadImage(option);
				imageUrls[option] = imageData?.url || '';
			} catch {
				failedImages[option] = true;
			}
		});

		await Promise.all(loadPromises);
		loading = false;
	}

	function handleImageError(option: string) {
		failedImages = { ...failedImages, [option]: true };
	}

	function selectOption(option: string) {
		value = option;
		onSelect(option);
	}

	onMount(() => {
		if (options.length > 0) {
			loadImagePreviews();
		}
	});

	const shouldLoadPreviews = $derived(options.length > 0 && options !== prevOptions);
	let prevOptions: string[] = $state([]);

	$effect(() => {
		if (shouldLoadPreviews) {
			prevOptions = [...options];
			loadImagePreviews();
		}
	});
</script>

<div class={cn('w-full', className)}>
	{#if label}
		<label class="text-foreground mb-3 block text-sm font-medium">{label}</label>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner />
			<span class="text-muted-foreground ml-3 text-sm">Loading images...</span>
		</div>
	{:else if options.length === 0}
		<div class="border-border bg-muted rounded-lg border p-8 text-center">
			<ImageIcon class="text-muted-foreground mx-auto h-12 w-12" />
			<span class="text-muted-foreground mt-2 block text-sm">No images available</span>
		</div>
	{:else}
		<div
			class={cn(
				'grid max-h-96 gap-3 overflow-y-auto',
				themes
					? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
					: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
			)}
		>
			{#each options.filter((option) => themes || !failedImages[option]) as option (option)}
				<button
					type="button"
					class={cn(
						'group relative overflow-hidden rounded-lg border-2 transition-all duration-200',
						'hover:scale-105 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none',
						disabled && 'cursor-not-allowed opacity-50',
						value === option
							? 'border-ring bg-accent shadow-lg'
							: 'border-border bg-card hover:border-border shadow-sm hover:shadow-md',
						themes ? 'aspect-square' : 'aspect-[800/165]'
					)}
					onclick={() => selectOption(option)}
					title={option}
					{disabled}
				>
					{#if imageUrls[option] && !failedImages[option]}
						<img
							class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
							src={imageUrls[option]}
							alt={option}
							onerror={() => handleImageError(option)}
						/>
					{:else}
						<div class="bg-muted flex h-full w-full items-center justify-center">
							<ImageIcon class="text-muted-foreground h-8 w-8" />
						</div>
					{/if}

					{#if value === option}
						<div class="absolute inset-0 bg-ring/10">
							<div class="absolute top-1 right-1 rounded-full bg-ring p-1 shadow-sm">
								<Check class="h-3 w-3 text-primary-foreground" />
							</div>
						</div>
					{/if}

					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-2"
					>
						<span class="truncate text-xs font-medium text-white">{option}</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
