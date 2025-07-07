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
			<ImagesTable imageNames={slotNames} deleteCallback={deleteBackground} {uploadBackground} />
		</div>
	{/snippet}
	{#snippet footerContent()}
		<div></div>
	{/snippet}
</PageCard>
