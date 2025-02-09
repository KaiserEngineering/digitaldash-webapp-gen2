<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { Menu, X } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let isMobileMenuOpen = false;

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
</script>

<header class="bg-background shadow-md">
	<div class="container mx-auto flex items-center justify-between px-4 py-4">
		<h1 class="text-2xl font-bold">Digital Dash</h1>
		<!-- Desktop Navigation (hidden on small screens) -->
		<nav class="hidden md:block">
			<ul class="flex space-x-4">
				<li>
					<Button variant={page.url.pathname === '/' ? 'default' : 'ghost'} href="/">Home</Button>
				</li>
				<li>
					<Button variant={page.url.pathname === '/themes' ? 'default' : 'ghost'} href="/themes">Themes</Button>
				</li>
				<li>
					<Button variant={page.url.pathname === '/backgrounds' ? 'default' : 'ghost'} href="/backgrounds">Backgrounds</Button>
				</li>
				<li>
					<Button variant={page.url.pathname === '/dynamic' ? 'default' : 'ghost'} href="/dynamic">Dynamic</Button>
				</li>
				<li>
					<Button variant={page.url.pathname === '/advanced' ? 'default' : 'ghost'} href="/advanced">Advanced</Button>
				</li>
			</ul>
		</nav>
		<!-- Mobile Navigation Toggle Button (visible on small screens) -->
		<button class="md:hidden focus:outline-none" onclick={toggleMobileMenu}>
			{#if isMobileMenuOpen}
				<X class="w-6 h-6" />
			{:else}
				<Menu class="w-6 h-6" />
			{/if}
		</button>
	</div>

	<!-- Mobile Navigation Dropdown (animated with slide) -->
	{#if isMobileMenuOpen}
		<nav transition:slide={{ duration: 300 }} class="md:hidden bg-background border-t border-gray-200">
			<ul class="flex flex-col space-y-2 px-4 py-4">
				<li>
					<Button
						variant={page.url.pathname === '/' ? 'default' : 'ghost'}
						href="/"
						onclick={() => (isMobileMenuOpen = false)}>
						Home
					</Button>
				</li>
				<li>
					<Button
						variant={page.url.pathname === '/themes' ? 'default' : 'ghost'}
						href="/themes"
						onclick={() => (isMobileMenuOpen = false)}>
						Themes
					</Button>
				</li>
				<li>
					<Button
						variant={page.url.pathname === '/backgrounds' ? 'default' : 'ghost'}
						href="/backgrounds"
						onclick={() => (isMobileMenuOpen = false)}>
						Backgrounds
					</Button>
				</li>
				<li>
					<Button
						variant={page.url.pathname === '/dynamic' ? 'default' : 'ghost'}
						href="/dynamic"
						onclick={() => (isMobileMenuOpen = false)}>
						Dynamic
					</Button>
				</li>
				<li>
					<Button
						variant={page.url.pathname === '/advanced' ? 'default' : 'ghost'}
						href="/advanced"
						onclick={() => (isMobileMenuOpen = false)}>
						Advanced
					</Button>
				</li>
			</ul>
		</nav>
	{/if}
</header>
