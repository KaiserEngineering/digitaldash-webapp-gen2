import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Chunk node_modules separately from app code
					if (id.includes('node_modules')) {
						// Group large UI libraries
						if (id.includes('lucide-svelte') || id.includes('motion-start')) {
							return 'ui-vendor';
						}
						// Group utility libraries
						if (id.includes('zod') || id.includes('sveltekit-superforms')) {
							return 'utils-vendor';
						}
						// Everything else goes to vendor
						return 'vendor';
					}
					// App code stays in main chunk
					return undefined;
				}
			}
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
