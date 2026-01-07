import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: adapter({
			precompress: true,
			strict: true
		}),

		version: {
			pollInterval: 0
		},

		alias: {
			'@/*': './src/lib/*',
			'$schemas/*': './src/schemas/*',
			'$local/*': './src/local/*'
		}
	}
};

export default config;
