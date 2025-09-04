<script lang="ts">
	import ImagesTable from '@/components/ImagesTable.svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { ImageIcon, RefreshCcw, Loader } from 'lucide-svelte';
	import { uploadBackground, deleteBackground, syncBackgrounds } from './backgrounds.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	const { data } = $props();
	const slotNames = data.slotNames || [];

	let isSyncing = $state(false);

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
	title="Backgrounds"
	description="Upload custom background images for your dashboard. Drag & drop or click empty slots to upload. Maximum size: 2MB. Supported format: PNG. After uploading, click the Sync button below to transfer images to your Digital Dash."
	icon={ImageIcon}
>
	<!-- Important Sync Notice -->
	<div class="mb-6 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200">
				<RefreshCcw class="h-4 w-4 text-orange-700" />
			</div>
			<div>
				<h3 class="font-bold text-orange-800">Important: Sync Required</h3>
				<p class="text-orange-700">
					Backgrounds will <strong>NOT appear on your Digital Dash</strong> until you click the
					<strong>"Sync Backgrounds"</strong> button below after uploading.
				</p>
			</div>
		</div>
	</div>

	<div class="flex flex-col items-center justify-center">
		<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
	</div>

	{#snippet footerContent()}
		<div class="border-border flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
			<div class="text-muted-foreground text-sm">
				{slotNames.length} background slot{slotNames.length === 1 ? '' : 's'}
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
