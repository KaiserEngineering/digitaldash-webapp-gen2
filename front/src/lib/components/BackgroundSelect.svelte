<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import { Check, Image as ImageIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import Spinner from './Spinner.svelte';

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select a background...',
		onSelect = () => {},
		class: className = '',
		disabled = false
	} = $props();

	const imageHandler = new ImageHandler();

	let loading = $state(true);
	let imageUrls = $state<Record<string, string>>({});
	let failedImages = $state<Record<string, boolean>>({});

	async function loadImagePreviews() {
		loading = true;

		const loadPromises = options.map(async (option) => {
			try {
				const imageData = await imageHandler.loadImage(option);
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
		if (disabled) return;
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
	{#if !value}
		<div class="text-foreground mb-4 text-sm font-medium">
			{placeholder}
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner />
			<span class="text-muted-foreground ml-2 text-sm">Loading backgrounds...</span>
		</div>
	{:else if options.length === 0}
		<div class="text-muted-foreground py-8 text-center text-sm">No backgrounds available</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each options.filter((option) => !failedImages[option]) as option (option)}
				<button
					type="button"
					class={cn(
						'group relative w-full transition-all duration-200',
						'hover:scale-[1.02] focus:scale-[1.02] focus:outline-none',
						value === option ? 'scale-[1.02]' : '',
						disabled && 'cursor-not-allowed opacity-50'
					)}
					onclick={() => selectOption(option)}
					{disabled}
					aria-pressed={value === option}
				>
					<div
						class={cn(
							'relative h-16 w-full overflow-hidden rounded-lg border-2 transition-all duration-200',
							value === option ? 'border-ring shadow-lg' : 'border-border hover:border-ring/50'
						)}
						style="aspect-ratio: 800/165;"
					>
						{#if imageUrls[option]}
							<img
								src={imageUrls[option] || '/placeholder.svg'}
								alt={option}
								class="h-full w-full object-cover"
								onerror={() => handleImageError(option)}
							/>
						{:else}
							<div class="bg-muted flex h-full w-full items-center justify-center">
								<ImageIcon class="text-muted-foreground h-8 w-8" />
							</div>
						{/if}

						{#if value === option}
							<div class="absolute top-2 right-2 rounded-full bg-ring p-1">
								<Check class="h-3 w-3 text-primary-foreground" />
							</div>
						{/if}

						<div class="absolute bottom-1 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
							{option}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
