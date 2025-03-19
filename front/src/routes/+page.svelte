<script lang="ts">
	import ViewCard from '@/components/ViewCard.svelte';
	import { ConfigStore } from '$lib/config.svelte';

	const views = ConfigStore.config ? ConfigStore.config.view : [];
</script>

<div class="space-y-2 p-2">
	{#each views as view, index (index)}
		<ViewCard {view} {index} />
	{/each}
</div>
