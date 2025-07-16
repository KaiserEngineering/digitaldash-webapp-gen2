<script lang="ts">
	import ImagesTable from '@/components/ImagesTable.svelte';
	import PageCard from '@/components/PageCard.svelte';
	import { ImageIcon } from 'lucide-svelte';
	import { uploadBackground, deleteBackground } from './backgrounds.svelte';

	const { data } = $props();
	const slotNames = data.slotNames || [];
</script>

<PageCard title="Backgrounds" description="Add custom backgrounds!" icon={ImageIcon}>
	{#snippet children()}
		<div class="mt-6 flex flex-col items-center justify-center">
			<h2 class="mb-2 text-xl font-semibold">Background Images</h2>
			<p class="mb-6 text-center text-sm text-gray-600 max-w-md">
				Upload custom background images for your dashboard. Drag & drop or click empty slots to upload. Maximum size: 2MB. Supported formats: PNG, JPG, GIF.
			</p>
			<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
		</div>
	{/snippet}
	{#snippet footerContent()}
		<div></div>
	{/snippet}
</PageCard>
