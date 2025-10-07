<script lang="ts">
	import ImagesTable from '@/components/ImagesTable.svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ImageIcon, HardDrive, Shield, RefreshCcw, Loader } from 'lucide-svelte';
	import { uploadBackground, deleteBackground, syncBackgrounds } from './backgrounds.svelte';
	import { ImageHandler } from '$lib/image/handler';
	import { Button } from '$lib/components/ui/button/index.js';
	import { onMount } from 'svelte';

	const { data } = $props();
	const slotNames = data.slotNames || [];
	const localImageNames = data.localImageNames || [];
	
	const imageHandler = new ImageHandler();
	let storageInfo = $state({ used: 0, total: 0, remaining: 0, count: 0 });
	let isSyncing = $state(false);

	onMount(() => {
		storageInfo = imageHandler.getLocalStorageInfo();
	});

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	async function handleSyncBackgrounds() {
		if (isSyncing) return;

		isSyncing = true;
		try {
			await syncBackgrounds();
		} catch (error) {
			console.error('Sync failed:', error);
		} finally {
			isSyncing = false;
		}
	}
</script>

<PageCard
	title="Local Backgrounds"
	description="Upload custom background images stored securely on your device. Images are saved locally and not shared with other devices for privacy."
	icon={ImageIcon}
>

	<!-- Local Storage Info -->
	{#if localImageNames.length > 0}
		<Card class="mb-6 border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20">
			<CardContent class="flex items-center gap-3 p-4">
				<div class="rounded-md bg-emerald-100 p-2 dark:bg-emerald-900/50">
					<Shield class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div class="flex-1">
					<h3 class="text-foreground text-sm font-medium">Local Storage</h3>
					<p class="text-foreground/70 text-xs">
						{storageInfo.count} images • {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)} used
						• {formatBytes(storageInfo.remaining)} remaining
					</p>
				</div>
				<HardDrive class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
			</CardContent>
		</Card>
	{/if}

	<div class="flex flex-col items-center justify-center">
		<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
	</div>

	{#snippet footerContent()}
		<div class="border-border flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
			<div class="text-muted-foreground text-center text-xs">
				<p class="flex items-center justify-center gap-1">
					<Shield class="h-3 w-3" />
					Images are stored locally on your device for privacy and security
				</p>
				<p class="mt-1">{slotNames.length} background slot{slotNames.length === 1 ? '' : 's'}</p>
			</div>
			<Button
				onclick={handleSyncBackgrounds}
				disabled={isSyncing}
				class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200"
			>
				{#if isSyncing}
					<Loader class="h-4 w-4 animate-spin" />
					Syncing...
				{:else}
					<RefreshCcw class="h-4 w-4" />
					Sync Backgrounds
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
