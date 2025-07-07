<!-- +layout.svelte -->
<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';
	import Spinner from '@/components/Spinner.svelte';

	let { children, data } = $props();
</script>

<div class="soft flex h-screen flex-col">
	{#await Promise.all([data.config, data.options, data.pids])}
		<!-- Loading screen -->
		<div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
			<Spinner />
			<h2 class="text-xl font-semibold text-gray-800 dark:text-white">Loading...</h2>
			<p class="text-sm text-gray-500 dark:text-gray-400">Loading your Digital Dash...</p>
		</div>
	{:then}
		<!-- App layout after data is ready -->
		<div class="soft flex h-screen flex-col">
			<Toaster />
			<Header />

			<main class="container mx-auto flex-1 px-4 py-4 sm:w-full md:w-2/3">
				{@render children()}
			</main>

			<Footer />
		</div>
	{:catch err}
		<!-- Error screen -->
		<div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
			<h2 class="text-2xl font-semibold text-red-600">Load Error</h2>
			<p class="text-gray-600">Something went wrong loading your dashboard:</p>
			<pre
				class="max-w-xl overflow-auto rounded-md bg-red-100 p-4 text-sm text-red-800 shadow-inner">{err.message}</pre>
		</div>
	{/await}
</div>
