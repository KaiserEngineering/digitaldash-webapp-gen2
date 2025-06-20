<script lang="ts">
	import DashboardCard from '@/components/DashboardCard.svelte';
	import ViewCard from '@/components/ViewCard.svelte';
	import { configStore } from '@/config/configStore';

	const views = $derived($configStore.view || []);
</script>

<div class="space-y-6">
	<DashboardCard>
		<div class="grid gap-4 sm:grid-cols-1">
			{#each views as view, index}
				<ViewCard {view} {index} />
			{/each}
		</div>
	</DashboardCard>
</div>
