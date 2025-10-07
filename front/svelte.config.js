import staticAdapter from '@sveltejs/adapter-static';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use Vercel adapter for Vercel builds, static adapter for normal builds
const isVercelBuild = process.env.VERCEL || process.env.VERCEL_ENV;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: isVercelBuild
			? vercelAdapter({
					runtime: 'nodejs20.x'
				})
			: staticAdapter({
					precompress: true,
					strict: true,
					fallback: 'index.html'
				}),

		version: {
			pollInterval: 0
		},

		...(isVercelBuild
			? {}
			: {
					output: {
						bundleStrategy: 'inline'
					}
				}),

		alias: {
			'@/*': './src/lib/*',
			'$schemas/*': './src/schemas/*',
			'$local/*': './src/local/*'
		}
	}
};

export default config;
