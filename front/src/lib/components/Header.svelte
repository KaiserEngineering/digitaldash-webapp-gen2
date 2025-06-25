<script lang="ts">
	import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card';
	import { Button } from './ui/button';
	import { Image, Settings, Zap, House, Menu, X, Bell, Upload } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';

	let isMobileMenuOpen = $state(false);

	const tabs = [
		{ label: 'Home', value: '', icon: House },
		{ label: 'Backgrounds', value: 'backgrounds', icon: Image },
		{ label: 'Dynamic', value: 'dynamic', icon: Zap },
		{ label: 'Alerts', value: 'alerts', icon: Bell },
		{ label: 'Advanced', value: 'advanced', icon: Settings },
		{ label: 'Firmware', value: 'firmware', icon: Upload }
	];

	let activeTab = $derived(
		tabs.some((t) => '/' + t.value === page.url.pathname) ? page.url.pathname.slice(1) : ''
	);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
</script>

<header class="bg-background border-border border-b">
	<div class="container mx-auto px-4">
		<Card class="border-0 bg-transparent shadow-none">
			<CardHeader class="pb-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<div>
							<div class="sm:hidden">
								<a href="/" class="flex items-center">
									<CardTitle class="text-primary-400 text-4xl font-bold">Digital Dash</CardTitle>
								</a>
							</div>

							<div class="hidden sm:block">
								<CardTitle class="text-primary-400 text-2xl font-bold lg:text-3xl">
									KaiserEngineering Digital Dash
								</CardTitle>
								<CardDescription class="text-muted-foreground text-sm">
									Manage your Digital Dash settings and preferences
								</CardDescription>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							class="sm:hidden h-12 w-12 text-primary-400"
							onclick={toggleMobileMenu}
							aria-label="Toggle navigation menu"
						>
							{#if isMobileMenuOpen}
								<X class="!h-10 !w-10 transition-transform duration-200" />
							{:else}
								<Menu class="!h-10 !w-10 transition-transform duration-200" />
							{/if}
						</Button>
					</div>
				</div>

				{#if isMobileMenuOpen}
					<div transition:slide={{ duration: 200 }} class="mt-3 text-center sm:hidden">
						<CardDescription class="text-muted-foreground text-sm">
							Manage your settings and preferences
						</CardDescription>
					</div>
				{/if}
			</CardHeader>

			<CardContent class="pt-0">
				<nav class="hidden sm:block" aria-label="Main navigation">
					<div class="bg-muted/50 border-border/30 flex gap-1 rounded-lg border p-1">
						{#each tabs as tab}
							{@const TabIcon = tab.icon}
							{@const isActive = activeTab === tab.value}
							<a
								href={'/' + tab.value}
								class={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
									isActive
										? 'bg-background text-foreground border-border/50 border shadow-sm'
										: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
								}`}
								aria-current={isActive ? 'page' : undefined}
							>
								<TabIcon class="h-4 w-4" />
								<span>{tab.label}</span>
							</a>
						{/each}
					</div>
				</nav>

				{#if isMobileMenuOpen}
					<nav
						class="sm:hidden"
						aria-label="Mobile navigation"
						transition:slide={{ duration: 200 }}
					>
						<div class="bg-muted/50 border-border/30 grid grid-cols-3 gap-2 rounded-lg border p-2">
							{#each tabs as tab}
								{@const TabIcon = tab.icon}
								{@const isActive = activeTab === tab.value}
								<a
									href={'/' + tab.value}
									class={`flex flex-col items-center gap-1 rounded-md p-3 text-xs font-medium transition-all duration-200 ${
										isActive
											? 'bg-background text-foreground shadow-sm'
											: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
									}`}
									aria-current={isActive ? 'page' : undefined}
								>
									<TabIcon class="h-5 w-5" />
									<span class="text-center leading-tight">{tab.label}</span>
								</a>
							{/each}
						</div>
					</nav>
				{/if}
			</CardContent>
		</Card>
	</div>
</header>
