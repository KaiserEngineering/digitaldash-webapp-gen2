<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	
	<Header />

	<main class="container mx-auto flex-grow px-4 py-8">
		{@render children()}
	</main>

	<Footer />
</div>
