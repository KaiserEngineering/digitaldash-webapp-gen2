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

	// Accept an object where keys map to file info.
	// (Alternatively, if your data is an array, you can adjust accordingly.)
	export let images: { [key: string]: { size: number; type: string; lastModified: number } } = {};
	// Whether the table should allow editing (e.g. show the delete button)
	export let editable: boolean = true;

	/** Delete handler – you might want to emit an event instead of handling deletion here */
	function handleDelete(key: string) {
		// Handle delete logic here (or dispatch an event)
		console.log('Delete image with key:', key);
	}

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
	<Table class="w-full table-fixed border border-gray-300">
		<TableHeader>
			<TableRow>
				<TableHead class="w-1/4 border p-2">Name</TableHead>
				<TableHead class="w-1/5 border p-2">Size</TableHead>
				<TableHead class="w-1/5 border p-2">Type</TableHead>
				<TableHead class="w-1/4 border p-2">Last Modified</TableHead>
				<TableHead class="w-1/6 border p-2 text-center">Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each Object.keys(images) as key}
				{@const image = images[key]}
				<TableRow>
					<TableCell class="border p-2">{key}</TableCell>
					<TableCell class="border p-2">{formatFileSize(image.size)}</TableCell>
					<TableCell class="border p-2">{image.type}</TableCell>
					<TableCell class="border p-2">{formatDate(image.lastModified)}</TableCell>
					<TableCell class="border p-2 text-center">
						{#if editable}
							<Button variant="destructive" size="icon" onclick={() => handleDelete(key)}>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/if}
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
{:else}
	<p class="text-center text-gray-500">No images found</p>
{/if}
