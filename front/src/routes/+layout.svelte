<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';
	import { getContext, setContext } from 'svelte';
	import type { DigitalDashConfig } from '$schemas/Digitaldash';

	let { children } = $props();

	// Create a global context for our config
	// the key of the context to prevent conflicts
	const CONTEXT_KEY = Symbol();

	export function set_configuration(configuration: DigitalDashConfig) {
		return setContext<DigitalDashConfig>(CONTEXT_KEY, configuration);
	}

	export function get_onfiguration() {
		return getContext<DigitalDashConfig>(CONTEXT_KEY);
	}
</script>

<div class="bg-linear-to-br from-gray-100 to-gray-200">
	<div class="min-h-screen">
		<Toaster />

		<Header />

		<main class="container mx-auto grow px-4 py-8 sm:w-full md:w-2/3">
			{@render children()}
		</main>
	</div>
	<Footer />
</div>
