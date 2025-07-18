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
			} catch (err) {
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

	let prevOptions: string[] = $state([]);

	$effect(() => {
		if (options.length > 0 && JSON.stringify(prevOptions) !== JSON.stringify(options)) {
			prevOptions = [...options];
			loadImagePreviews();
		}
	});
</script>

<div class={cn('w-full', className)}>
	{#if !value}
		<div class="mb-4 text-sm font-medium text-gray-700">
			{placeholder}
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner />
			<span class="ml-2 text-sm text-gray-500">Loading backgrounds...</span>
		</div>
	{:else if options.length === 0}
		<div class="py-8 text-center text-sm text-gray-500">No backgrounds available</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each options.filter(option => !failedImages[option]) as option}
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
							value === option
								? 'border-blue-500 shadow-lg'
								: 'border-gray-200 hover:border-blue-300'
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
							<div class="flex h-full w-full items-center justify-center bg-gray-100">
								<ImageIcon class="h-8 w-8 text-gray-400" />
							</div>
						{/if}

						{#if value === option}
							<div class="absolute right-2 top-2 rounded-full bg-blue-500 p-1">
								<Check class="h-3 w-3 text-white" />
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