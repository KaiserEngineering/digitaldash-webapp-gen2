<script lang="ts">
	import { Card, CardTitle, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		Image,
		Settings,
		Zap,
		House,
		Menu,
		X,
		Bell,
		Upload,
		ChevronDown,
		Moon,
		Sun,
		HardDrive
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/state';
	import { theme, toggleTheme } from '$lib/stores/theme';

	let isMobileMenuOpen = $state(false);
	let isFirmwareDropdownOpen = $state(false);
	let isMobileFirmwareExpanded = $state(false);

	const tabs = [
		{ label: 'Home', value: '', icon: House },
		{ label: 'Backgrounds', value: 'backgrounds', icon: Image },
		{ label: 'Dynamic', value: 'dynamic', icon: Zap },
		{ label: 'Alerts', value: 'alerts', icon: Bell },
		{ label: 'Advanced', value: 'advanced', icon: Settings },
		{ label: 'Device Info', value: 'device/info', icon: HardDrive },
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

	// Breadcrumb text for Home tab
	let homeTabText = $derived.by(() => {
		const path = page.url.pathname;
		const viewMatch = path.match(/^\/view\/(\d+)/);
		if (viewMatch) {
			const viewId = parseInt(viewMatch[1]);
			return `Home > View ${viewId + 1}`;
		}
		return 'Home';
	});

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

<svelte:window onclick={handleClickOutside} />

<header
	class="bg-background/95 border-border/40 sticky top-0 z-50 border-b shadow-sm backdrop-blur-md"
>
	<div class="container mx-auto px-4 lg:px-6">
		<Card class="border-0 bg-transparent pb-0 shadow-none">
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="flex flex-col gap-2">
						<div class="relative">
							<!-- Mobile Title -->
							<div class="sm:hidden">
								<a href="/" class="group flex items-center">
									<CardTitle
										class="text-primary-400 text-3xl font-bold transition-all duration-300"
									>
										Digital Dash
									</CardTitle>
								</a>
							</div>
							<!-- Desktop Title -->
							<div class="hidden sm:block">
								<a href="/" class="group block">
									<CardTitle
										class="text-primary-400 group-hover:text-primary-600 text-2xl font-bold transition-colors duration-200 lg:text-3xl xl:text-4xl"
									>
										Digital Dash
									</CardTitle>
									<div
										class="bg-primary-500 group-hover:bg-primary-600 mt-2 h-1 w-16 rounded-full transition-colors duration-200"
									></div>
								</a>
							</div>
						</div>
					</div>

					<!-- Desktop Actions -->
					<div class="hidden items-center gap-2 sm:flex">
						<!-- Dark Mode Toggle -->
						<Button
							variant="ghost"
							size="icon"
							class="text-primary-400 h-10 w-10 transition-all duration-200 hover:scale-110"
							onclick={toggleTheme}
							aria-label="Toggle dark mode"
						>
							{#if $theme === 'dark'}
								<Sun class="h-5 w-5 transition-transform duration-200" />
							{:else}
								<Moon class="h-5 w-5 transition-transform duration-200" />
							{/if}
						</Button>
					</div>

					<!-- Mobile Actions -->
					<div class="flex items-center gap-2 sm:hidden">
						<!-- Dark Mode Toggle -->
						<Button
							variant="ghost"
							size="icon"
							class="text-primary-400 h-10 w-10 transition-all duration-200"
							onclick={toggleTheme}
							aria-label="Toggle dark mode"
						>
							{#if $theme === 'dark'}
								<Sun class="h-4 w-4 transition-transform duration-200" />
							{:else}
								<Moon class="h-4 w-4 transition-transform duration-200" />
							{/if}
						</Button>

						<!-- Mobile Menu Button -->
						<Button
							variant="ghost"
							size="icon"
							class="border-border/50 bg-background/50 hover:bg-accent/80 hover:border-border h-11 w-11 rounded-xl border backdrop-blur-sm transition-all duration-200"
							onclick={toggleMobileMenu}
							aria-label="Toggle navigation menu"
						>
							{#if isMobileMenuOpen}
								<X class="h-5 w-5 rotate-90 transition-transform duration-200" />
							{:else}
								<Menu class="h-5 w-5 transition-transform duration-200" />
							{/if}
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<!-- Desktop Navigation -->
				<nav class="hidden sm:block" aria-label="Main navigation">
					<div
						class="bg-muted/30 border-border/30 rounded-2xl border p-2 shadow-lg backdrop-blur-sm"
					>
						<div class="flex justify-center gap-1">
							{#each tabs as tab (tab.value)}
								{@const TabIcon = tab.icon}
								{@const isActive =
									tab.value === ''
										? page.url.pathname === '/' || page.url.pathname.startsWith('/view/')
										: page.url.pathname.startsWith('/' + tab.value)}
								{@const displayLabel = tab.value === '' ? homeTabText : tab.label}

								{#if tab.subItems}
									<!-- Dropdown for Firmware -->
									<div class="firmware-dropdown relative">
										<button
											class={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
												isActive
													? 'bg-background text-foreground border-border/50 scale-105 border shadow-md'
													: 'text-muted-foreground hover:text-foreground hover:bg-background/80 hover:scale-105 hover:shadow-sm'
											}`}
											onclick={toggleFirmwareDropdown}
											aria-expanded={isFirmwareDropdownOpen}
										>
											<TabIcon
												class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
											/>
											<span class="font-semibold">{displayLabel}</span>
											<ChevronDown
												class={`h-3 w-3 transition-all duration-300 ${
													isFirmwareDropdownOpen ? 'rotate-180 scale-110' : 'group-hover:scale-110'
												}`}
											/>
										</button>

										{#if isFirmwareDropdownOpen}
											<!-- Dropdown panel -->
											<div
												class="border-border/50 bg-popover/95 absolute left-0 z-20 mt-2 min-w-[200px] rounded-xl border shadow-xl backdrop-blur-md"
												transition:slide={{ duration: 250 }}
											>
												<div class="p-2">
													{#each tab.subItems as sub (sub.value)}
														{@const isSubActive = page.url.pathname === '/' + sub.value}
														<a
															href={'/' + sub.value}
															class={`block rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
																isSubActive
																	? 'bg-accent text-accent-foreground scale-105 shadow-sm'
																	: 'hover:bg-muted/50 hover:scale-105'
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
										class={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
											isActive
												? 'bg-background text-foreground border-border/50 scale-105 border shadow-md'
												: 'text-muted-foreground hover:text-foreground hover:bg-background/80 hover:scale-105 hover:shadow-sm'
										}`}
										aria-current={isActive ? 'page' : undefined}
									>
										<TabIcon
											class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
										/>
										<span class="font-semibold">{displayLabel}</span>
									</a>
								{/if}
							{/each}
						</div>
					</div>
				</nav>

				<!-- Mobile Navigation -->
				{#if isMobileMenuOpen}
					<nav
						class="mt-4 sm:hidden"
						aria-label="Mobile navigation"
						transition:slide={{ duration: 300 }}
					>
						<div
							class="bg-muted/20 border-border/30 rounded-2xl border p-3 shadow-xl backdrop-blur-md"
						>
							<div class="space-y-2">
								{#each tabs as tab (tab.value)}
									{@const TabIcon = tab.icon}
									{@const isActive =
										tab.value === ''
											? page.url.pathname === '/' || page.url.pathname.startsWith('/view/')
											: activeTab === tab.value}
									{@const displayLabel = tab.value === '' ? homeTabText : tab.label}

									{#if tab.subItems}
										<!-- Firmware with expandable sub-items -->
										<div class="space-y-1">
											<button
												class={`flex w-full items-center justify-between gap-3 rounded-xl p-4 text-sm font-medium transition-all duration-300 ${
													isActive
														? 'bg-background text-foreground border-border/50 border shadow-md'
														: 'text-muted-foreground hover:text-foreground hover:bg-background/60'
												}`}
												onclick={toggleMobileFirmware}
											>
												<div class="flex items-center gap-3">
													<TabIcon class="h-5 w-5" />
													<span class="font-semibold">{displayLabel}</span>
												</div>
												<ChevronDown
													class={`h-4 w-4 transition-transform duration-300 ${
														isMobileFirmwareExpanded ? 'rotate-180' : ''
													}`}
												/>
											</button>

											{#if isMobileFirmwareExpanded}
												<div class="ml-8 space-y-1" transition:slide={{ duration: 250 }}>
													{#each tab.subItems as sub (sub.value)}
														{@const isSubActive = page.url.pathname === '/' + sub.value}
														<a
															href={'/' + sub.value}
															class={`block rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
																isSubActive
																	? 'bg-accent text-accent-foreground shadow-sm'
																	: 'text-muted-foreground hover:text-foreground hover:bg-background/60'
															}`}
															onclick={() => {
																isMobileMenuOpen = false;
																isMobileFirmwareExpanded = false;
															}}
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
											class={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium transition-all duration-300 ${
												isActive
													? 'bg-background text-foreground border-border/50 border shadow-md'
													: 'text-muted-foreground hover:text-foreground hover:bg-background/60'
											}`}
											aria-current={isActive ? 'page' : undefined}
											onclick={() => {
												isMobileMenuOpen = false;
												isMobileFirmwareExpanded = false;
											}}
										>
											<TabIcon class="h-5 w-5" />
											<span class="font-semibold">{displayLabel}</span>
										</a>
									{/if}
								{/each}
							</div>
						</div>
					</nav>
				{/if}
			</CardContent>
		</Card>
	</div>
</header>
