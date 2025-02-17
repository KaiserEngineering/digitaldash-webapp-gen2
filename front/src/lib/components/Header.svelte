<script lang="ts">
	import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card';
	import { Tabs, TabsList } from '@/components/ui/tabs';
	import { Palette, Image, Settings, Zap, House, Menu, X } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	// Track whether the mobile menu is open
	let isMobileMenuOpen = false;

	const tabs = [
		{ label: 'Home', value: '', icon: House },
		{ label: 'Themes', value: 'themes', icon: Palette },
		{ label: 'Backgrounds', value: 'backgrounds', icon: Image },
		{ label: 'Dynamic', value: 'dynamic', icon: Zap },
		{ label: 'Advanced', value: 'advanced', icon: Settings }
	];
</script>

<!-- Reduced outer padding and vertical spacing -->
<div class="container mx-auto space-y-4 px-2 py-4">
	<Card class="border-0 shadow-lg">
		<CardHeader>
			<!-- Header Top Row -->
			<div class="flex items-center justify-between">
				<!-- Minimal Mobile Header: always visible on mobile -->
				<div class="sm:hidden">
					<a href="/"><CardTitle class="text-base font-bold">Digital Dash</CardTitle></a>
				</div>
				<!-- Desktop Header -->
				<div class="hidden sm:block">
					<CardTitle
						class="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
					>
						KaiserEngineering Digital Dash
					</CardTitle>
					<CardDescription class="mt-1 text-sm text-muted-foreground/80">
						Manage your Digital Dash settings and preferences
					</CardDescription>
				</div>
				<!-- Mobile Hamburger Toggle -->
				<button
					class="p-2 focus:outline-none sm:hidden"
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				>
					{#if isMobileMenuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
			<!-- Expanded Mobile Header: only visible when the menu is open -->
			{#if isMobileMenuOpen}
				<div transition:slide class="mt-2 text-center">
					<CardDescription class="text-sm text-muted-foreground/80">
						Manage your settings and preferences
					</CardDescription>
				</div>
			{/if}
		</CardHeader>

		<CardContent class="space-y-4">
			<!-- Desktop Navigation: always visible on medium and up -->
			<div class="hidden sm:block">
				<Tabs class="w-full">
					<TabsList
						class="scrollbar-hide mb-2 mt-2 flex w-auto gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50"
					>
						{#each tabs as tab}
							{@const TabIcon = tab.icon}
							<a
								href={'/' + tab.value}
								class="flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
							>
								<TabIcon class="h-4 w-4" />
								<span class="hidden text-sm sm:inline">{tab.label}</span>
							</a>
						{/each}
					</TabsList>
				</Tabs>
			</div>
			<!-- Mobile Navigation: Collapsible menu (visible on small screens) -->
			{#if isMobileMenuOpen}
				<div transition:slide class="w-full sm:hidden">
					<div class="rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50">
						<Tabs class="w-full">
							<TabsList class="scrollbar-hide mb-2 mt-2 flex gap-1">
								{#each tabs as tab}
									{@const TabIcon = tab.icon}
									<a
										href={'/' + tab.value}
										class="flex items-center justify-center rounded-md px-2 py-1 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
										onclick={() => (isMobileMenuOpen = false)}
									>
										<TabIcon class="h-4 w-4" />
									</a>
								{/each}
							</TabsList>
						</Tabs>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
