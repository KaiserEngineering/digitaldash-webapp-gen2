<script lang="ts">
	import DashboardCard from '@/components/DashboardCard.svelte';
	import ViewCard from '@/components/ViewCard.svelte';
	import { configStore } from '$lib/stores/configStore';
	import { pidsStore } from '$lib/stores/PIDsStore';

	const views = $derived($configStore?.view || []);
	const pids = $derived(pidsStore.getValue());
</script>

<div class="space-y-2 sm:space-y-4">
	<DashboardCard>
		{#each views as view, index}
			<ViewCard {view} {index} {pids} />
		{/each}
	</DashboardCard>
</div>
