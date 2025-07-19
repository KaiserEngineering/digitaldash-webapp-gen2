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
			<span class="ml-2 text-sm text-gray-500">Loading themes...</span>
		</div>
	{:else if options.length === 0}
		<div class="py-8 text-center text-sm text-gray-500">No themes available</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each options.filter((option) => !failedImages[option]) as option}
				<button
					type="button"
					class={cn(
						'group relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 bg-white p-2 transition-all duration-200',
						'hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:shadow-md focus:outline-none',
						value === option ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200',
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
						<div class="flex h-full w-full items-center justify-center rounded bg-gray-100">
							<ImageIcon class="h-8 w-8 text-gray-400" />
						</div>
					{/if}

					{#if value === option}
						<div class="absolute -top-1 -right-1 rounded-full bg-blue-500 p-1">
							<Check class="h-3 w-3 text-white" />
						</div>
					{/if}

					<div class="mt-1 truncate text-xs text-gray-600 group-hover:text-gray-800">
						{option}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
