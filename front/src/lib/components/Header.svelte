<script lang="ts">
	import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card';
	import { Tabs, TabsList } from '@/components/ui/tabs';
	import { Palette, Image, Settings, Zap, House } from 'lucide-svelte';

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
			<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
				<div class="text-center sm:text-left">
					<CardTitle
						class="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
					>
						KaiserEngineering Digital Dash
					</CardTitle>
					<CardDescription class="text-muted-foreground/80 mt-2 text-base sm:text-lg">
						Manage your Digital Dash settings and preferences
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<Tabs class="w-full">
				<TabsList
					class="scrollbar-hide mb-2 mt-2 flex w-auto gap-1 overflow-x-auto overflow-y-hidden rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50"
				>
					{#each tabs as tab}
						{@const TabIcon = tab.icon}
						<!-- Use an anchor tag to navigate -->
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
		</CardContent>
	</Card>
</div>
