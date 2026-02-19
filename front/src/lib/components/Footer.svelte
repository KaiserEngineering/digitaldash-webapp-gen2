<script lang="ts">
	import VersionInfo from '$lib/components/VersionInfo.svelte';
</script>

<footer class="">
	<div class="container mx-auto px-2 py-2 sm:px-4 sm:py-3">
		<div class="flex items-center justify-between">
			<p class="text-sm sm:text-base">
				&copy; 2025 <span class="text-primary font-semibold">Digital Dash</span>. All rights
				reserved.
			</p>
			<div class="flex items-center gap-2">
				<VersionInfo />
				<span class="text-muted-foreground text-xs">·</span>
				<a href="/logs" class="text-muted-foreground hover:text-foreground text-xs transition-colors">logs</a>
			</div>
		</div>
	</div>
</footer>
