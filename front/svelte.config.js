import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			precompress: false,
			strict: true,
			fallback: 'index.html'
		}),

		version: {
			pollInterval: 0
		},

		output: {
			bundleStrategy: 'inline'
		},

		alias: {
			'@/*': './src/lib/*',
			'$schemas/*': './src/schemas/*',
			'$local/*': './src/local/*'
		}
	}
};

export default config;
