<script lang="ts">
	import '../app.css';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<header class="bg-background shadow-md">
		<div class="container mx-auto flex items-center justify-between px-4 py-4">
			<h1 class="text-2xl font-bold">Digital Dash</h1>
			<nav>
				<ul class="flex space-x-4">
					<li>
						<Button variant={$page.url.pathname === '/' ? 'default' : 'ghost'} href="/">Home</Button
						>
					</li>
					<li>
						<Button variant={$page.url.pathname === '/themes' ? 'default' : 'ghost'} href="/themes"
							>Themes</Button
						>
					</li>
					<li>
						<Button
							variant={$page.url.pathname === '/backgrounds' ? 'default' : 'ghost'}
							href="/backgrounds">Backgrounds</Button
						>
					</li>
					<li>
						<Button
							variant={$page.url.pathname === '/dynamic' ? 'default' : 'ghost'}
							href="/dynamic">Dynamic</Button
						>
					</li>
					<li>
						<Button
							variant={$page.url.pathname === '/advanced' ? 'default' : 'ghost'}
							href="/advanced">Advanced</Button
						>
					</li>
				</ul>
			</nav>
		</div>
	</header>

	<main class="container mx-auto flex-grow px-4 py-8">
		{@render children()}
	</main>

	<footer class="bg-background mt-auto shadow-md">
		<div class="container mx-auto px-4 py-4 text-center">
			<p>&copy; 2025 My App. All rights reserved.</p>
		</div>
	</footer>
</div>
