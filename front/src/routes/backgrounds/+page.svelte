<script lang="ts">
	import ImagesTable from '@/components/ImagesTable.svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { ImageIcon } from 'lucide-svelte';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';

	const { data } = $props();
	const slotNames = data.slotNames || [];
</script>

<PageCard
	title="Backgrounds"
	description="Upload custom background images for your dashboard. Drag & drop or click empty slots to upload. Maximum size: 2MB. Supported format: PNG."
	icon={ImageIcon}
>
	{#snippet children()}
		<div class="flex flex-col items-center justify-center">
			<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
		</div>
	{/snippet}
	{#snippet footerContent()}
		<div></div>
	{/snippet}
</PageCard>
