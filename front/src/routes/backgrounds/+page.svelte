<script lang="ts">
	import ImagesTable from '@/components/ImagesTable.svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { ImageIcon, RefreshCcw  } from 'lucide-svelte';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	const { data } = $props();
	const slotNames = data.slotNames || [];

	async function handleAddBackground() {
		console.log("Sync Backgrounds clicked");
		try {
			const res = await fetch("/api/backgrounds/mirror", {
				method: "POST"
			});
			if (!res.ok) throw new Error("Sync Backgrounds request failed");
			const json = await res.json();
			console.log("Mirror response:", json);
		} catch (err) {
			console.error("Failed to sync:", err);
		}
	}
</script>

<PageCard
	title="Backgrounds"
	description="Upload custom background images for your dashboard. Drag & drop or click empty slots to upload. Maximum size: 2MB. Supported format: PNG."
	icon={ImageIcon}
>
	<div class="flex flex-col items-center justify-center">
		<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
	</div>

	{#snippet footerContent()}
		<div class="border-border flex flex-col items-center justify-between gap-4 py-4 md:flex-row">
			<div class="text-muted-foreground text-sm">
				{slotNames.length} background slot{slotNames.length === 1 ? '' : 's'}
			</div>
			<Button
				on:click={handleAddBackground}
				class="btn-primary flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-all duration-200"
			>
				<RefreshCcw  class="h-4 w-4" />
				Sync Backgrounds
			</Button>
		</div>
	{/snippet}
</PageCard>
