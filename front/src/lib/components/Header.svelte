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

<div class="container mx-auto space-y-8 px-4 py-8">
	<Card class="border-0 shadow-lg">
		<CardHeader class="pb-6">
			<!-- Header Top Row: Always shows the hamburger toggle on mobile and full content on desktop -->
			<div class="flex items-center justify-between gap-4">
				<!-- Desktop header: Always visible on sm and up -->
				<div class="hidden text-center sm:block sm:text-left">
					<CardTitle
						class="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
					>
						KaiserEngineering Digital Dash
					</CardTitle>
					<CardDescription class="text-muted-foreground/80 mt-2 text-base sm:text-lg">
						Manage your Digital Dash settings and preferences
					</CardDescription>
				</div>
				<!-- Mobile hamburger toggle (visible on small screens) -->
				<button
					class="p-2 focus:outline-none sm:hidden"
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
				>
					{#if isMobileMenuOpen}
						<X class="h-6 w-6" />
					{:else}
						<Menu class="h-6 w-6" />
					{/if}
				</button>
			</div>

			<!-- Mobile header content: Visible only when hamburger menu is open -->
			<div class="block sm:hidden">
				<div transition:slide class="mt-4 text-center">
					<CardTitle
						class="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-2xl font-bold text-transparent"
					>
						KaiserEngineering Digital Dash
					</CardTitle>
					<CardDescription class="text-muted-foreground/80 mt-2 text-sm">
						Manage your Digital Dash settings and preferences
					</CardDescription>
				</div>
			</div>
		</CardHeader>

		<CardContent class="space-y-6">
			<!-- Desktop Navigation: Always visible on medium and up -->
			<div class="hidden sm:block">
				<Tabs class="w-full">
					<TabsList
						class="scrollbar-hide mb-2 mt-2 flex w-auto gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50"
					>
						{#each tabs as tab}
							{@const TabIcon = tab.icon}
							<a
								href={'/' + tab.value}
								class="flex items-center gap-2 rounded-md px-4 py-3 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
							>
								<TabIcon class="h-5 w-5" />
								<span class="hidden sm:inline">{tab.label}</span>
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
							<!-- Use a horizontal flex layout by default (no flex-col) -->
							<TabsList class="scrollbar-hide mb-2 mt-2 flex gap-1">
								{#each tabs as tab}
									{@const TabIcon = tab.icon}
									<a
										href={'/' + tab.value}
										class="flex items-center justify-center rounded-md px-4 py-3 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
										onclick={() => (isMobileMenuOpen = false)}
									>
										<TabIcon class="h-5 w-5" />
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
