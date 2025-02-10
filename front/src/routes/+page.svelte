<script lang="ts">
	import { Toggle } from '@/components/ui/toggle';
	import { Card } from '@/components/ui/card';
	import { Button } from '@/components/ui/button';

	type PID = {
		name: string;
		unit: string;
	};

	type View = {
		name: string;
		PIDs: PID[];
		enabled: boolean;
		dynamic: boolean;
		theme: string;
		background: string;
	};

	let views: View[] = [
		{
			name: 'Engine Performance',
			PIDs: [
				{ name: 'RPM', unit: 'rpm' },
				{ name: 'Speed', unit: 'km/h' },
				{ name: 'Throttle', unit: '%' }
			],
			enabled: true,
			dynamic: false,
			theme: '/themes/engine.png',
			background: '/backgrounds/carbon-fiber.jpg'
		},
		{
			name: 'Fuel Economy',
			PIDs: [
				{ name: 'Fuel Rate', unit: 'L/h' },
				{ name: 'MPG', unit: 'mpg' }
			],
			enabled: false,
			dynamic: true,
			theme: '/themes/fuel.png',
			background: '/backgrounds/eco-green.jpg'
		}
	];

	function toggleEnabled(index: number) {
		views[index].enabled = !views[index].enabled;
		views = [...views];
	}
</script>

<div class="container mx-auto space-y-4 p-4">
	{#each views as view, index}
		<Card class="p-4">
			<div class="mb-2 flex items-center justify-between">
				<h2 class="text-xl font-semibold">{view.name}</h2>
				<Toggle
					pressed={view.enabled}
					onPressedChange={() => toggleEnabled(index)}
					aria-label="Toggle view"
				>
					{view.enabled ? 'Enabled' : 'Disabled'}
				</Toggle>
			</div>
			<div class="mb-2">
				<strong>PIDs:</strong>
				<ul class="list-inside list-disc">
					{#each view.PIDs as pid}
						<li>{pid.name} ({pid.unit})</li>
					{/each}
				</ul>
			</div>
			{#if view.dynamic}
				<Button href="/dynamic" variant="link" class="mb-2 h-auto p-0">Dynamic View</Button>
			{/if}
			<div class="mt-4 grid grid-cols-2 gap-4">
				<div>
					<strong>Theme:</strong>
					<img
						src={view.theme || '/placeholder.svg'}
						alt="Theme preview"
						class="mt-2 h-32 w-full rounded-md object-cover"
					/>
				</div>
				<div>
					<strong>Background:</strong>
					<img
						src={view.background || '/placeholder.svg'}
						alt="Background preview"
						class="mt-2 h-32 w-full rounded-md object-cover"
					/>
				</div>
			</div>
		</Card>
	{/each}
</div>
