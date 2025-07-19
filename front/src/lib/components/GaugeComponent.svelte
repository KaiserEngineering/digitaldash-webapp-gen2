<script lang="ts">
	import type { PIDMetadata } from '$lib/stores/PIDsStore';

	let {
		gauge,
		gaugeIndex,
		themeUrl,
		failed,
		textColor = 'white',
		onImageError,
		numGauges = 1,
		pids = []
	} = $props();

	// Helper function to find PID label by desc (since config stores desc but we want to show label)
	function getPidLabelByDesc(pidDesc: string): string {
		if (!pidDesc) return '';
		const pid = pids.find((p: PIDMetadata) => p.desc === pidDesc);
		return pid ? pid.label : pidDesc;
	}
</script>

<div class="mt-4 flex h-full flex-col items-center justify-center">
	<div class="relative flex items-center justify-center">
		{#if themeUrl && !failed}
			<img
				class="aspect-square w-full max-w-[80px] min-w-[40px] object-contain transition-all duration-300 sm:max-w-[100px] sm:min-w-[60px] md:max-w-[120px] lg:max-w-[140px]"
				src={themeUrl || '/placeholder.svg'}
				alt={gauge.theme}
				onerror={onImageError}
			/>

			{#if gauge.pid}
				<div
					class="absolute left-1/2 -translate-x-1/2 translate-y-5 rounded border border-white/20 bg-black/60 px-1 py-0.5 text-xs backdrop-blur-sm"
				>
					<span style:color={textColor} style:opacity="0.9">{getPidLabelByDesc(gauge.pid)}</span>
				</div>
			{/if}
		{:else}
			<div
				class="flex h-12 w-12 flex-col items-center justify-center rounded border border-white/20 bg-black/40 sm:h-16 sm:w-16"
			>
				<span class="text-xs text-white/60">{gauge.theme}</span>
				{#if gauge.pid}
					<span class="mt-1 text-xs text-white/80">{getPidLabelByDesc(gauge.pid)}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
