<script lang="ts">
	let {
		gauge,
		gaugeIndex,
		themeUrl,
		failed,
		textColor = 'white',
		onImageError,
		numGauges = 1
	} = $props();

	// Adjust image size based on number of gauges to prevent overcrowding
	const getImageSizeClass = (numGauges: number) => {
		switch (numGauges) {
			case 1:
				return 'max-w-[140px] md:max-w-[160px] lg:max-w-[180px]';
			case 2:
				return 'max-w-[120px] md:max-w-[140px] lg:max-w-[160px]';
			case 3:
				return 'max-w-[80px] md:max-w-[90px] lg:max-w-[100px]';
			default:
				return 'max-w-[100px] md:max-w-[120px] lg:max-w-[140px]';
		}
	};
</script>

<div class="flex h-full flex-col items-center justify-center px-2">
	<div class="relative flex items-center justify-center">
		{#if themeUrl && !failed}
			<img
				class="aspect-square w-full object-contain transition-all duration-300 {getImageSizeClass(
					numGauges
				)}"
				src={themeUrl || '/placeholder.svg'}
				alt={gauge.theme}
				onerror={onImageError}
			/>

			{#if gauge.pid}
				<div
					class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border border-white/20 bg-black/60 px-2 py-0.5 text-xs backdrop-blur-sm"
				>
					<span style:color={textColor} style:opacity="0.9">{gauge.pid}</span>
				</div>
			{/if}
		{:else}
			<div
				class="flex h-16 w-16 flex-col items-center justify-center rounded border border-white/20 bg-black/40"
			>
				<span class="text-xs text-white/60">{gauge.theme}</span>
				{#if gauge.pid}
					<span class="mt-1 text-xs text-white/80">{gauge.pid}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
