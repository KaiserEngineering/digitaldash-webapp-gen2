import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte', '@sveltejs/kit'],
					ui: ['bits-ui', 'lucide-svelte', 'tailwind-merge'],
					utils: ['clsx', 'zod', 'sveltekit-superforms']
				}
			}
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
