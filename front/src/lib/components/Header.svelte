<script lang="ts">
	import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card';
	import { Button } from './ui/button';
	import { Image, Settings, Zap, House, Menu, X, Bell, Upload, ChevronDown } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';

	let isMobileMenuOpen = $state(false);
	let isFirmwareDropdownOpen = $state(false);
	let isMobileFirmwareExpanded = $state(false);

	const tabs = [
		{ label: 'Home', value: '', icon: House },
		{ label: 'Backgrounds', value: 'backgrounds', icon: Image },
		{ label: 'Dynamic', value: 'dynamic', icon: Zap },
		{ label: 'Alerts', value: 'alerts', icon: Bell },
		{ label: 'Advanced', value: 'advanced', icon: Settings },
		{
			label: 'Firmware',
			value: 'firmware',
			icon: Upload,
			subItems: [
				{ label: 'Web App', value: 'firmware/web' },
				{ label: 'Digital Dash', value: 'firmware/stm' }
			]
		}
	];

	let activeTab = $derived(
		tabs.some((t) => '/' + t.value === page.url.pathname) ? page.url.pathname.slice(1) : ''
	);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
		// Close firmware dropdown when mobile menu closes
		if (!isMobileMenuOpen) {
			isMobileFirmwareExpanded = false;
		}
	}

	function toggleFirmwareDropdown() {
		isFirmwareDropdownOpen = !isFirmwareDropdownOpen;
	}

	function toggleMobileFirmware() {
		isMobileFirmwareExpanded = !isMobileFirmwareExpanded;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.firmware-dropdown')) {
			isFirmwareDropdownOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

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
							class="text-primary-400 h-12 w-12 sm:hidden"
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
				<!-- Desktop Navigation -->
				<nav class="hidden sm:block" aria-label="Main navigation">
					<div class="bg-muted/50 border-border/30 flex gap-1 rounded-lg border p-1">
						{#each tabs as tab}
							{@const TabIcon = tab.icon}
							{@const isActive = page.url.pathname.startsWith('/' + tab.value)}

							{#if tab.subItems}
								<!-- Dropdown for Firmware -->
								<div class="firmware-dropdown relative">
									<button
										class={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
											isActive
												? 'bg-background text-foreground border-border/50 border shadow-sm'
												: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
										}`}
										onclick={toggleFirmwareDropdown}
										aria-expanded={isFirmwareDropdownOpen}
									>
										<TabIcon class="h-4 w-4" />
										<span>{tab.label}</span>
										<ChevronDown
											class={`h-3 w-3 transition-transform duration-200 ${isFirmwareDropdownOpen ? 'rotate-180' : ''}`}
										/>
									</button>

									{#if isFirmwareDropdownOpen}
										<!-- Dropdown panel -->
										<div
											class="bg-popover text-popover-foreground absolute left-0 z-10 mt-2 min-w-[180px] rounded-md border shadow-md"
											transition:slide={{ duration: 200 }}
										>
											<div class="p-1">
												{#each tab.subItems as sub}
													{@const isSubActive = page.url.pathname === '/' + sub.value}
													<a
														href={'/' + sub.value}
														class={`block rounded-sm px-3 py-2 text-sm transition-colors duration-200 ${
															isSubActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
														}`}
														onclick={() => (isFirmwareDropdownOpen = false)}
													>
														{sub.label}
													</a>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else}
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
							{/if}
						{/each}
					</div>
				</nav>

				<!-- Mobile Navigation -->
				{#if isMobileMenuOpen}
					<nav
						class="sm:hidden"
						aria-label="Mobile navigation"
						transition:slide={{ duration: 200 }}
					>
						<div class="bg-muted/50 border-border/30 space-y-2 rounded-lg border p-2">
							{#each tabs as tab}
								{@const TabIcon = tab.icon}
								{@const isActive = activeTab === tab.value}

								{#if tab.subItems}
									<!-- Firmware with expandable sub-items -->
									<div class="space-y-1">
										<button
											class={`flex w-full items-center justify-between gap-2 rounded-md p-3 text-sm font-medium transition-all duration-200 ${
												isActive
													? 'bg-background text-foreground shadow-sm'
													: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
											}`}
											onclick={toggleMobileFirmware}
										>
											<div class="flex items-center gap-2">
												<TabIcon class="h-5 w-5" />
												<span>{tab.label}</span>
											</div>
											<ChevronDown
												class={`h-4 w-4 transition-transform duration-200 ${isMobileFirmwareExpanded ? 'rotate-180' : ''}`}
											/>
										</button>

										{#if isMobileFirmwareExpanded}
											<div class="ml-7 space-y-1" transition:slide={{ duration: 200 }}>
												{#each tab.subItems as sub}
													{@const isSubActive = page.url.pathname === '/' + sub.value}
													<a
														href={'/' + sub.value}
														class={`block rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
															isSubActive
																? 'bg-accent text-accent-foreground'
																: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
														}`}
													>
														{sub.label}
													</a>
												{/each}
											</div>
										{/if}
									</div>
								{:else}
									<a
										href={'/' + tab.value}
										class={`flex items-center gap-2 rounded-md p-3 text-sm font-medium transition-all duration-200 ${
											isActive
												? 'bg-background text-foreground shadow-sm'
												: 'text-muted-foreground hover:text-foreground hover:bg-background/70'
										}`}
										aria-current={isActive ? 'page' : undefined}
									>
										<TabIcon class="h-5 w-5" />
										<span>{tab.label}</span>
									</a>
								{/if}
							{/each}
						</div>
					</nav>
				{/if}
			</CardContent>
		</Card>
	</div>
</header>
