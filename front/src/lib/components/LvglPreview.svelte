<script lang="ts">
	// Renders a view with the device firmware's own LVGL UI, compiled to
	// WebAssembly (digitaldash-firmware-gen2-stm32u5g/sim). Gauges sweep
	// through each PID's range so themes can be judged in motion.
	import { onMount } from 'svelte';
	import type { DigitalDash } from '$schemas/digitaldash';
	import type { PIDMetadata } from '$lib/stores/PIDsStore';

	let {
		config,
		pids = [],
		viewIndex = 0,
		class: className = ''
	}: {
		config: DigitalDash | null;
		pids?: PIDMetadata[];
		viewIndex?: number;
		class?: string;
	} = $props();

	const SNIFF_MODE = 0xde;

	let canvas: HTMLCanvasElement;
	let sim: any = $state(null);
	let error = $state('');

	// The firmware matches gauge PIDs by description; older configs use labels.
	function toDesc(pid: string) {
		return pids.find((p) => p.desc === pid)?.desc ?? pids.find((p) => p.label === pid)?.desc ?? pid;
	}

	// Show only the view being edited, and keep dynamic rules from switching away.
	function previewConfig(cfg: DigitalDash) {
		return {
			...cfg,
			view: cfg.view.map((v, i) => ({
				...v,
				enable: i === viewIndex ? 'Enabled' : 'Disabled',
				gauge: v.gauge.map((g) => ({ ...g, pid: toDesc(g.pid) }))
			})),
			dynamic: cfg.dynamic?.map((d) => ({ ...d, enable: 'Disabled' })),
			alert: cfg.alert?.map((a) => ({ ...a, pid: toDesc(a.pid) }))
		};
	}

	function callString(name: string, value: string) {
		return sim.ccall(name, 'number', ['string'], [value]);
	}

	onMount(() => {
		let frame = 0;
		let disposed = false;

		(async () => {
			try {
				// Served as-is from static/, so keep the URL out of Vite's import analysis.
				const url = '/sim/dd_sim.js';
				const { default: create } = await import(/* @vite-ignore */ url);
				if (disposed) return;
				const instance = await create();
				instance._sim_init();
				sim = instance;
			} catch (e) {
				error = `Simulator failed to load: ${e}`;
				return;
			}

			const w = sim._sim_width();
			const h = sim._sim_height();
			canvas.width = w;
			canvas.height = h;
			const ctx = canvas.getContext('2d')!;
			const image = ctx.createImageData(w, h);
			let last = performance.now();

			const tick = (now: number) => {
				if (disposed) return;
				const elapsed = Math.max(1, Math.round(now - last));
				last = now;

				pids.forEach((p, i) => {
					const min = p.min[0] ?? 0;
					const max = p.max[0] ?? 100;
					const t = (Math.sin(now / 1500 + i) + 1) / 2;
					sim._sim_set_pid(((SNIFF_MODE << 16) | (i + 1)) >>> 0, min + (max - min) * t);
				});

				sim._sim_step(elapsed);

				if (sim._sim_frame_dirty()) {
					const ptr = sim._sim_framebuffer();
					const src = sim.HEAPU8.subarray(ptr, ptr + w * h * 4);
					const dst = image.data;
					for (let p = 0; p < dst.length; p += 4) {
						dst[p] = src[p + 2];
						dst[p + 1] = src[p + 1];
						dst[p + 2] = src[p];
						dst[p + 3] = 255;
					}
					ctx.putImageData(image, 0, 0);
				}
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		})();

		return () => {
			disposed = true;
			cancelAnimationFrame(frame);
		};
	});

	// Config PID names resolve against the loaded table, so reload both together.
	$effect(() => {
		if (!sim || !config) return;
		if (pids.length) callString('sim_load_pids', JSON.stringify(pids));
		callString('sim_load_config', JSON.stringify(previewConfig(config)));
	});
</script>

<div class={className}>
	<canvas bind:this={canvas} class="aspect-[1024/200] w-full rounded-lg bg-black"></canvas>
	{#if error}
		<p class="text-destructive mt-2 text-sm">{error}</p>
	{/if}
</div>
