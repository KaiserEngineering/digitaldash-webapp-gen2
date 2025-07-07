<script lang="ts">
	let { gauge, gaugeIndex, themeUrl, failed, textColor = 'white', onImageError } = $props();
</script>

<div class="flex h-full flex-col items-center justify-center px-2">
	<div class="relative flex items-center justify-center">
		{#if themeUrl && !failed}
			<img
				class="aspect-square w-full max-w-[100px] object-contain transition-all duration-300 md:max-w-[120px] lg:max-w-[140px]"
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
				class="flex h-16 w-16 items-center justify-center rounded border border-white/20 bg-black/40"
			>
				<span class="text-xs text-white/60">{gauge.theme}</span>
			</div>
		{/if}
	</div>
</div>
