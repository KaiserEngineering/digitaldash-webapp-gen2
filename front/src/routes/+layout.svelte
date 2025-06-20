<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';

	let { children } = $props();
</script>

<div class="soft flex h-screen flex-col">
	<Toaster />
	<Header />

	<main class="container mx-auto flex-1 px-4 py-4 sm:w-full md:w-2/3">
		{@render children()}
	</main>

	<Footer />
</div>
