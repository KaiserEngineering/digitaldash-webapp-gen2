<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';

	let { children } = $props();
</script>

<div class="bg-gradient-to-br from-gray-100 to-gray-200">
	<div class="min-h-screen">
		<Toaster />

		<Header />

		<main class="container mx-auto flex-grow px-4 py-8 sm:w-full md:w-2/3">
			{@render children()}
		</main>
	</div>
	<Footer />
</div>

<style lang="postcss">
	:global(.scrollbar-hide::-webkit-scrollbar) {
		display: none;
	}
	:global(.scrollbar-hide) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	:global(.tabs .active) {
		@apply bg-white text-primary shadow-lg dark:bg-gray-800;
	}
</style>
