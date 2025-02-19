<script lang="ts">
	import ViewCard from '@/components/ViewCard.svelte';

	// Example views
	let views: any = [
		{
			id: '1',
			name: 'Daily Driver',
			enabled: true,
			background: 'dog.png.gz',
			gauges: [
				{
					id: '1',
					label: 'Oil Temp',
					theme: { face: 'Stock' },
					pid: 'OIL_TEMP',
					enabled: true,
					unit: '°C'
				},
				{
					id: '2',
					label: 'RPM',
					theme: { face: 'StockRS' },
					pid: 'RPM',
					enabled: true
				},
				{
					id: '3',
					label: 'Boost',
					theme: { face: 'Bar' },
					pid: 'BOOST',
					enabled: true,
					unit: 'psi'
				}
			]
		},
		{
			id: '2',
			name: 'View Two',
			enabled: false,
			background: 'flare.png.gz',
			gauges: [
				{
					id: '1',
					label: 'Oil Temp',
					theme: { face: 'Stock' },
					pid: 'OIL_TEMP',
					enabled: true,
					unit: '°C'
				}
			]
		}
	];
</script>

<div class="space-y-2 p-2">
	{#each views as view (view.id)}
		<ViewCard {view} />
	{/each}
</div>
