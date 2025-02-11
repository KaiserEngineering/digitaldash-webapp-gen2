<script lang="ts">
	import { onMount } from 'svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Zap } from 'lucide-svelte';
	// (If you are using the Zap icon, remember to import it, e.g., import { Zap } from 'lucide-svelte';)

	// Define types
	type GaugeTheme = {
		face: string;
	};

	type Gauge = {
		id: string;
		label: string;
		theme: GaugeTheme;
		pid: string;
		enabled: boolean;
		unit?: string;
	};

	type View = {
		id: string;
		name: string;
		enabled: boolean;
		background: string;
		gauges: Gauge[];
		// New property to store the ideal text color based on the background brightness
		textColor?: string;
	};

	let views: View[] = [
		{
			id: '1',
			name: 'Daily Driver',
			enabled: true,
			background: 'Galaxy.png',
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
					enabled: true,
					unit: undefined
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
			background: 'Flare.png',
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

	function toggleView(viewId: string) {
		views = views.map((view) => ({
			...view,
			enabled: view.id === viewId ? !view.enabled : view.enabled
		}));
	}

	/**
	 * Computes the average brightness of an image.
	 * Returns a promise that resolves with the average brightness (0–255).
	 */
	function computeAverageBrightness(imageSrc: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			// This is useful if your images are hosted elsewhere or if you run into CORS issues.
			img.crossOrigin = 'Anonymous';
			img.src = imageSrc;
			img.onload = () => {
				// Create a canvas with the same dimensions as the image.
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject('No 2D context available');
					return;
				}
				ctx.drawImage(img, 0, 0);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				let totalBrightness = 0;
				const data = imageData.data;
				// Iterate over every pixel (each pixel uses 4 array elements: R, G, B, A)
				for (let i = 0; i < data.length; i += 4) {
					// Use the luminosity formula:
					// brightness = 0.299*R + 0.587*G + 0.114*B
					const brightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
					totalBrightness += brightness;
				}
				const avgBrightness = totalBrightness / (data.length / 4);
				resolve(avgBrightness);
			};
			img.onerror = (err) => {
				reject(err);
			};
		});
	}

	// On mount, compute the ideal text color for each view based on its background brightness.
	onMount(() => {
		views.forEach(async (view) => {
			const imageUrl = `/backgrounds/${view.background}`;
			try {
				const brightness = await computeAverageBrightness(imageUrl);
				// Use a threshold of 128 (midpoint of 0–255) to decide the text color.
				view.textColor = brightness > 128 ? 'black' : 'white';
			} catch (error) {
				console.error('Error computing brightness:', error);
				// Fallback text color in case of error.
				view.textColor = 'black';
			}
			// Reassign to trigger reactivity.
			views = [...views];
		});
	});
</script>

<div class="space-y-2 p-2">
	{#each views as view}
		<!-- Dynamically set the background image -->
		<div
			class="rounded-3xl bg-cover p-2 shadow-lg"
			style:background-image={`url('/backgrounds/${view.background}')`}
		>
			<!-- Header: view name, toggle, and Zap (placed under the toggle) -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold" style:color={view.textColor}>{view.name}</h2>
				<div class="flex flex-col items-end">
					<Switch checked={view.enabled} onCheckedChange={() => toggleView(view.id)} />
					<a href="/dynamic" title="Dynamic Mode" class="mt-2">
						<Zap size="24" color={view.enabled ? 'green' : 'yellow'} />
					</a>
				</div>
			</div>

			<!-- Gauges arranged horizontally -->
			<div class="flex justify-center space-x-2">
				{#each view.gauges as gauge}
					<div class="flex flex-col items-center">
						<div class="relative h-24 w-24">
							<img
								src={`/themes/${gauge.theme.face}/face.png`}
								alt="Gauge Face"
								class="h-full w-full"
							/>
							<img
								src={`/themes/${gauge.theme.face}/needle.png`}
								alt="Gauge Needle"
								class="absolute inset-0"
							/>
						</div>
						<span class="mt-2 rounded-full bg-purple-600 px-4 py-1 text-sm text-white">
							{gauge.label}
						</span>

						<!-- Display PID with unit if applied -->
						<span class="text-xs text-white">
							{gauge.pid}{gauge.unit ? ` (${gauge.unit})` : ''}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	/* Add any additional custom styles here */
</style>
