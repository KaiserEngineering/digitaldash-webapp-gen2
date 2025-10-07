import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'));
const version = packageJson.version;
const buildDate = new Date().toISOString();
const buildTimestamp = Date.now().toString();

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	define: {
		__APP_VERSION__: JSON.stringify(version),
		__BUILD_DATE__: JSON.stringify(buildDate),
		__BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp)
	},
	build: {
		rollupOptions: {
			output: {}
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
