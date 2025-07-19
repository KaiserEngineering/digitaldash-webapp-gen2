import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: adapter({
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
		},

		// Exclude API routes in production
		files: {
			routes: isDev ? 'src/routes' : 'src/routes/!(api)'
		}
	}
};

export default config;
