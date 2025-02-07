<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let files: File[] = [];
	let uploadedFiles: { name: string; size: number; type: string; lastModified: number }[] = [];

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			files = Array.from(input.files);
		}
	}

	function handleUpload() {
		// In a real application, you would send the files to a server here
		// For this example, we'll just add them to the uploadedFiles array
		uploadedFiles = [
			...uploadedFiles,
			...files.map((file) => ({
				name: file.name,
				size: file.size,
				type: file.type,
				lastModified: file.lastModified
			}))
		];
		files = [];
	}

	function handleDelete(index: number) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
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

	onMount(() => {
		// You could load existing files from a server here
	});
</script>

<div class="container mx-auto space-y-4 p-4">
	<h1 class="mb-4 text-2xl font-bold">Themes</h1>

	<div class="flex space-x-2">
		<Input type="file" multiple onchange={handleFileChange} />
		<Button onclick={handleUpload} disabled={files.length === 0}>Upload</Button>
	</div>

	{#if uploadedFiles.length > 0}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Size</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Last Modified</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each uploadedFiles as file, index}
					<TableRow>
						<TableCell>{file.name}</TableCell>
						<TableCell>{formatFileSize(file.size)}</TableCell>
						<TableCell>{file.type}</TableCell>
						<TableCell>{formatDate(file.lastModified)}</TableCell>
						<TableCell>
							<Button variant="destructive" size="icon" onclick={() => handleDelete(index)}>
								<Trash2 class="h-4 w-4" />
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<p class="text-center text-gray-500">No files uploaded yet.</p>
	{/if}
</div>
