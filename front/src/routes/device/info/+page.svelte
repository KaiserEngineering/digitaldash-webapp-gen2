<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert, Loader, FileText, Trash2, RefreshCw, HardDrive } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import toast from 'svelte-5-french-toast';
	import PageCard from '@/components/PageCard.svelte';
	import SpiffsUsage from '$lib/components/SpiffsUsage.svelte';

	interface DeviceFile {
		name: string;
		size: number;
		type: string;
	}

	let filesStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let files: DeviceFile[] = $state([]);
	let deletingFiles = $state<Set<string>>(new Set());

	async function loadFiles() {
		filesStatus = 'loading';
		try {
			const res = await fetch('/api/spiffs?filter=all');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to load files');
			files = data.files || [];
			filesStatus = 'success';
		} catch {
			filesStatus = 'error';
			files = [];
		}
	}

	async function deleteFile(filename: string) {
		if (deletingFiles.has(filename)) return;

		const confirmed = confirm(`Are you sure you want to delete "${filename}"?`);
		if (!confirmed) return;

		deletingFiles.add(filename);
		deletingFiles = deletingFiles; // Trigger reactivity

		try {
			const response = await fetch(`/api/spiffs?filename=${encodeURIComponent(filename)}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				toast.success(`File "${filename}" deleted successfully`);
				await loadFiles(); // Reload file list
			} else {
				const error = await response.json().catch(() => ({ message: 'Unknown error' }));
				toast.error(`Failed to delete file: ${error.message}`);
			}
		} catch (error) {
			console.error('Delete error:', error);
			toast.error(`Network error while deleting file`);
		} finally {
			deletingFiles.delete(filename);
			deletingFiles = deletingFiles; // Trigger reactivity
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getTotalFilesSize(): number {
		return files.reduce((total, file) => total + (file.size || 0), 0);
	}

	onMount(() => {
		loadFiles();
	});
</script>

<PageCard
	title="Device Information"
	description="View device status and manage files stored in flash memory. Monitor storage usage and system information."
	icon={HardDrive}
	footerContent={null}
>
	<!-- SPIFFS Usage Stats -->
	<SpiffsUsage />

	<!-- File List Actions -->
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-2 font-medium">
			<FileText class="h-5 w-5" />
			All Files ({files.length} files, {formatFileSize(getTotalFilesSize())})
		</h3>
		<Button onclick={loadFiles} disabled={filesStatus === 'loading'} variant="outline" size="sm">
			{#if filesStatus === 'loading'}
				<Loader class="mr-2 h-4 w-4 animate-spin" />
				Loading...
			{:else}
				<RefreshCw class="mr-2 h-4 w-4" />
				Refresh Files
			{/if}
		</Button>
	</div>

	<!-- File List -->
	<div class="border-border bg-muted min-h-[120px] rounded-lg border">
		{#if filesStatus === 'loading'}
			<div class="text-muted-foreground flex items-center justify-center gap-3 py-8">
				<Loader class="h-5 w-5 animate-spin" />
				<span class="font-medium">Loading files...</span>
			</div>
		{:else if filesStatus === 'error'}
			<div class="flex items-center justify-center gap-3 py-8 text-red-600">
				<TriangleAlert class="h-5 w-5" />
				<span class="font-medium">Failed to load files</span>
			</div>
		{:else if files.length === 0}
			<div class="text-muted-foreground flex items-center justify-center py-8">
				<span class="font-medium">No firmware files found</span>
			</div>
		{:else}
			<div class="divide-border divide-y">
				{#each files as file, index (file.name || index)}
					{@const isDeleting = deletingFiles.has(file.name)}
					<div
						class="hover:bg-background p-4 transition-colors duration-150 {index === 0
							? 'rounded-t-lg'
							: ''} {index === files.length - 1 ? 'rounded-b-lg' : ''} {isDeleting
							? 'opacity-50'
							: ''}"
					>
						<div class="flex items-start gap-4">
							<div
								class="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
							>
								<FileText class="text-foreground h-6 w-6" />
							</div>
							<div class="min-w-0 flex-grow">
								<h5 class="text-foreground truncate font-medium">
									{file.name || file}
								</h5>
								<div
									class="text-muted-foreground mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3"
								>
									{#if file.size}
										<div class="flex items-center gap-1">
											<span class="font-medium">Size:</span>
											<span>{(file.size / 1024).toFixed(1)} KB</span>
										</div>
									{/if}
									{#if file.type}
										<div class="flex items-center gap-1">
											<span class="font-medium">Type:</span>
											<span>{file.type}</span>
										</div>
									{/if}
									<div class="flex items-center gap-1">
										<Button
											onclick={() => deleteFile(file.name)}
											disabled={isDeleting}
											variant="outline"
											size="sm"
											class="h-6 px-2 text-xs text-red-600 hover:border-red-200 hover:bg-red-50"
										>
											{#if isDeleting}
												<Loader class="mr-1 h-3 w-3 animate-spin" />
												Deleting...
											{:else}
												<Trash2 class="mr-1 h-3 w-3" />
												Delete
											{/if}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</PageCard>
