<script lang="ts">
	import DashboardCard from '@/components/DashboardCard.svelte';
	import ViewCard from '@/components/ViewCard.svelte';
	import { configStore } from '$lib/stores/configStore';
	import { pidsStore } from '$lib/stores/PIDsStore';

	const views = $derived($configStore.view || []);
	const pids = $derived(pidsStore.getValue());
</script>

<div class="space-y-6">
	<DashboardCard>
		<div class="grid gap-4 sm:grid-cols-1">
			{#each views as view, index}
				<ViewCard {view} {index} {pids} />
			{/each}
		</div>
	</DashboardCard>
</div>
