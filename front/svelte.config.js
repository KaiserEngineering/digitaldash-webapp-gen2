import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({ script: true }),

	server: {
		proxy: {
			'/api': {
				target: 'http://localhost', // External API
				changeOrigin: true, // For changing the origin of the request
				rewrite: (path) => path.replace(/^\/api/, '') // Optional: rewrite path if necessary
			}
		}
	},

	kit: {
		adapter: adapter({
			precompress: true,
			strict: false
		}),
		output: {
			bundleStrategy: 'inline'
		},
		alias: {
			'@/*': './src/lib/*',
			'$schemas/*': './src/schemas/*'
		},
		prerender: {
			handleHttpError: ({ status, path, referrer, message }) => {
				console.warn(`❗️ Prerender failed: ${path} (${status}) - ${message}`);
			}
		}
	}
};

export default config;
