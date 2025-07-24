<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import { Check, Image as ImageIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import Spinner from './Spinner.svelte';

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select a theme...',
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
				const imageData = await imageHandler.loadTheme(option);
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
			<span class="text-muted-foreground ml-2 text-sm">Loading themes...</span>
		</div>
	{:else if options.length === 0}
		<div class="text-muted-foreground py-8 text-center text-sm">No themes available</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each options.filter((option) => !failedImages[option]) as option (option)}
				<button
					type="button"
					class={cn(
						'group relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 bg-card p-2 transition-all duration-200',
						'hover:border-ring/50 hover:shadow-md focus:border-ring focus:shadow-md focus:outline-none',
						value === option ? 'border-ring bg-accent shadow-md' : 'border-border',
						disabled && 'cursor-not-allowed opacity-50'
					)}
					onclick={() => selectOption(option)}
					{disabled}
					aria-pressed={value === option}
				>
					{#if imageUrls[option]}
						<img
							src={imageUrls[option] || '/placeholder.svg'}
							alt={option}
							class="h-full w-full rounded border object-cover"
							onerror={() => handleImageError(option)}
						/>
					{:else}
						<div class="bg-muted flex h-full w-full items-center justify-center rounded">
							<ImageIcon class="text-muted-foreground h-8 w-8" />
						</div>
					{/if}

					{#if value === option}
						<div class="absolute -top-1 -right-1 rounded-full bg-ring p-1">
							<Check class="h-3 w-3 text-primary-foreground" />
						</div>
					{/if}

					<div class="text-muted-foreground group-hover:text-foreground mt-1 truncate text-xs">
						{option}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
