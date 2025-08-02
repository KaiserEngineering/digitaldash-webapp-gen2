<script lang="ts">
	import type { PIDMetadata } from '$lib/stores/PIDsStore';

	let { gauge, themeUrl, failed, textColor = 'white', onImageError, pids = [] } = $props();

	// Helper function to find PID label by desc (since config stores desc but we want to show label)
	function getPidLabelByDesc(pidDesc: string): string {
		if (!pidDesc) return '';
		const pid = pids.find((p: PIDMetadata) => p.desc === pidDesc);
		return pid ? pid.label : pidDesc;
	}
</script>

<div class="mt-4 flex h-full flex-col items-center justify-center">
	<div class="relative flex h-[120px] w-[120px] items-center justify-center sm:h-[140px] sm:w-[140px]">
		{#if themeUrl && !failed}
			<img
				class="absolute inset-0 aspect-square w-full object-contain transition-all duration-300"
				src={themeUrl || '/placeholder.svg'}
				alt={gauge.theme}
				onerror={onImageError}
			/>

			{#if gauge.pid}
				<div
					class="absolute bottom-0 left-1/2 -translate-x-1/2 rounded border whitespace-nowrap border-white/20 bg-black/60 px-12 py-1 text-s backdrop-blur-sm"
				>
					<span style:color={textColor} style:opacity="0.9">
						{getPidLabelByDesc(gauge.pid)}
					</span>
				</div>
			{/if}
		{:else}
			<div
				class="flex h-full w-full flex-col items-center justify-center rounded border border-white/20 bg-black/40"
			>
				<span class="text-xl text-white/60">{gauge.theme}</span>
				{#if gauge.pid}
					<span class="mt-1 text-xl text-white/80">{getPidLabelByDesc(gauge.pid)}</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
