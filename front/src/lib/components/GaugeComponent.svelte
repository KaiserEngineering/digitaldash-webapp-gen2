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
	<div
		class="relative flex h-[80px] w-[80px] items-center justify-center sm:h-[100px] sm:w-[100px]"
	>
		{#if themeUrl && !failed}
			<img
				class="aspect-square w-full object-contain transition-all duration-300"
				src={themeUrl || '/placeholder.svg'}
				alt={gauge.theme}
				onerror={onImageError}
			/>
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
	{#if gauge.pid && themeUrl && !failed}
		<div
			class="mt-0.5 rounded border border-white/20 bg-black/60 px-2 py-1 text-xs backdrop-blur-sm"
		>
			<span style:color={textColor} style:opacity="0.9" class="block truncate text-center">
				{getPidLabelByDesc(gauge.pid)}
			</span>
		</div>
	{/if}
</div>
