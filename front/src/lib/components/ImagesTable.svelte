<!-- src/lib/ImagesTable.svelte -->
<script lang="ts">
	import {
		Table,
		TableHead,
		TableHeader,
		TableRow,
		TableCell,
		TableBody
	} from '@/components/ui/table';
	import { Trash2 } from 'lucide-svelte';
	import { Button } from '@/components/ui/button';

	let { images, editable = true, deleteCallback = () => {} } = $props();

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
		else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
		else return (bytes / 1073741824).toFixed(2) + ' GB';
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString();
	}
</script>

{#if images && Object.keys(images).length > 0}
	<div class="overflow-x-auto rounded bg-white shadow-sm">
		<Table class="w-full table-auto border border-gray-300">
			<TableHeader>
				<TableRow class="bg-gray-100">
					<TableHead class="p-2 text-left">Name</TableHead>
					<TableHead class="p-2 text-left">Size</TableHead>
					<TableHead class="p-2 text-left">Type</TableHead>
					<TableHead class="p-2 text-left">Last Modified</TableHead>
					{#if editable}
						<TableHead class="p-2 text-center">Actions</TableHead>
					{/if}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each Object.keys(images) as key}
					{@const image = images[key]}
					<TableRow class="odd:bg-gray-50 hover:bg-gray-50">
						<TableCell class="p-2 align-middle">{key}</TableCell>
						<TableCell class="p-2 align-middle">{formatFileSize(image.size)}</TableCell>
						<TableCell class="p-2 align-middle">{image.type}</TableCell>
						<TableCell class="p-2 align-middle">{formatDate(image.lastModified)}</TableCell>
						{#if editable}
							<TableCell class="p-2 text-center align-middle">
								<Button variant="destructive" size="icon" on:click={() => deleteCallback(key)}>
									<Trash2 class="h-4 w-4" />
								</Button>
							</TableCell>
						{/if}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{:else}
	<p class="mt-4 text-center text-gray-500">No images found</p>
{/if}
