<script lang="ts">
	import { ImageHandler } from '$lib/image/handler';
	import { ChevronDown, Check, Image as ImageIcon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import Spinner from './Spinner.svelte';

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select an image...',
		onSelect = () => {},
		class: className = '',
		disabled = false,
		themes = false
	} = $props();

	const imageHandler = new ImageHandler();

	let isOpen = $state(false);
	let loading = $state(true);
	let imageUrls = $state<Record<string, string>>({});
	let failedImages = $state<Record<string, boolean>>({});
	let selectElement = $state<HTMLElement | null>(null);
	let dropdownElement = $state<HTMLDivElement | null>(null);

	async function loadImagePreviews() {
		loading = true;

		const loadPromises = options.map(async (option) => {
			try {
				const imageData = themes
					? await imageHandler.loadTheme(option)
					: await imageHandler.loadImage(option);
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
		value = option;
		onSelect(option);
		isOpen = false;
	}

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
	}

	function handleClickOutside(event: { target: any }) {
		if (selectElement && !selectElement.contains(event.target)) {
			isOpen = false;
		}
	}

	function handleKeydown(event: { key: any; preventDefault: () => void }) {
		if (disabled) return;

		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				toggleDropdown();
				break;
			case 'Escape':
				isOpen = false;
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					isOpen = true;
				}
				break;
		}
	}

	onMount(() => {
		if (options.length > 0) {
			loadImagePreviews();
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	let prevOptions: string[] = $state([]);

	$effect(() => {
		if (options.length > 0 && JSON.stringify(prevOptions) !== JSON.stringify(options)) {
			prevOptions = [...options];
			loadImagePreviews();
		}
	});
</script>

<div bind:this={selectElement} class={cn('relative w-full', className)}>
	<button
		type="button"
		class={cn(
			'relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-left shadow-sm transition-colors',
			'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
			disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
			isOpen && 'border-blue-500 ring-1 ring-blue-500'
		)}
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				{#if loading}
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
						<Spinner size="sm" />
					</div>
				{:else if value && imageUrls[value] && !failedImages[value]}
					<img
						src={imageUrls[value] || '/placeholder.svg'}
						alt={value}
						class="h-8 w-8 rounded border object-cover"
						onerror={() => handleImageError(value)}
					/>
				{:else if value}
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
						<ImageIcon class="h-4 w-4 text-gray-400" />
					</div>
				{:else}
					<div class="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
						<ImageIcon class="h-4 w-4 text-gray-300" />
					</div>
				{/if}

				<span class={cn('block truncate', !value && 'text-gray-500')}>
					{value || placeholder}
				</span>
			</div>

			<ChevronDown
				class={cn(
					'h-4 w-4 text-gray-400 transition-transform duration-200',
					isOpen && 'rotate-180'
				)}
			/>
		</div>
	</button>

	{#if isOpen}
		<div
			bind:this={dropdownElement}
			class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg"
			role="listbox"
		>
			<div class="max-h-60 overflow-auto py-1">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<Spinner />
						<span class="ml-2 text-sm text-gray-500">Loading images...</span>
					</div>
				{:else if options.length === 0}
					<div class="px-3 py-2 text-sm text-gray-500">No images available</div>
				{:else}
					{#each options as option}
						<button
							type="button"
							class={cn(
								'relative w-full cursor-pointer px-3 py-2 text-left transition-colors',
								'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
								value === option && 'bg-blue-50 text-blue-600'
							)}
							onclick={() => selectOption(option)}
							role="option"
							aria-selected={value === option}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-3">
									{#if imageUrls[option] && !failedImages[option]}
										<img
											src={imageUrls[option] || '/placeholder.svg'}
											alt={option}
											class="h-10 w-10 rounded border object-cover"
											onerror={() => handleImageError(option)}
										/>
									{:else}
										<div class="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
											<ImageIcon class="h-5 w-5 text-gray-400" />
										</div>
									{/if}

									<div class="flex flex-col">
										<span class="text-sm font-medium">{option}</span>
										{#if failedImages[option]}
											<span class="text-xs text-red-500">Failed to load</span>
										{:else if imageUrls[option]}
											<span class="text-xs text-gray-500">Loaded</span>
										{:else}
											<span class="text-xs text-gray-400">Loading...</span>
										{/if}
									</div>
								</div>

								{#if value === option}
									<Check class="h-4 w-4 text-blue-600" />
								{/if}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
