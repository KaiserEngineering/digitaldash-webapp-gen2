<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';

	let { children } = $props();
</script>

<div class="bg-linear-to-br from-gray-100 to-gray-300">
	<div class="min-h-screen">
		<Toaster />

		<Header />

		<main class="container mx-auto grow px-4 py-8 sm:w-full md:w-2/3">
			{@render children()}
		</main>
	</div>
	<Footer />
</div>
