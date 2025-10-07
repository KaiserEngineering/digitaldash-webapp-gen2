<script lang="ts">
	import { VERSION_INFO } from '$lib/version';

	let { class: className = '' } = $props();

	// Format build date for display
	const buildDate = new Date(VERSION_INFO.buildDate).toLocaleString();
</script>

<div class="text-muted-foreground cursor-help text-xs {className}" title="Built: {buildDate}">
	{VERSION_INFO.display}
</div>
