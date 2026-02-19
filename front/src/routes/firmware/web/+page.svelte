<script lang="ts">
	import { FileSearch, Upload, CircleCheck, CloudUpload } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import toast from 'svelte-5-french-toast';
	import { apiUrl } from '$lib/config';
	import { uploadWithProgress, UPLOAD_LIMITS, validateFile } from '$lib/utils/upload';
	import PageCard from '@/components/PageCard.svelte';

	let { data } = $props();
	const ver = data?.ver || 'Unknown';

	let file: File | null = $state(null);
	let dragActive = $state(false);
	let uploadProgress = $state(0);
	let uploadComplete = $state(false);
	let isUploading = $state(false);

	function handleDrag(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') dragActive = true;
		else if (e.type === 'dragleave') dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			file = e.dataTransfer.files[0];
			resetUploadState();
		}
	}

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			file = target.files[0];
			resetUploadState();
		}
	}

	function resetUploadState() {
		uploadProgress = 0;
		uploadComplete = false;
	}

	async function startUpload() {
		if (!file) return toast.error('No file selected.');

		// Validate file before upload
		const validation = validateFile(file, {
			maxSize: UPLOAD_LIMITS.FIRMWARE,
			allowedTypes: ['.bin']
		});
		if (!validation.valid) {
			toast.error(validation.error!);
			return;
		}

		resetUploadState();
		isUploading = true;

		const result = await uploadWithProgress(`${apiUrl}/firmware/web`, file, {
			maxSize: UPLOAD_LIMITS.FIRMWARE,
			timeout: 360000, // 6 minutes for firmware
			onProgress: (percent) => {
				uploadProgress = percent;
			},
			context: 'Web firmware upload'
		});

		isUploading = false;

		if (result.success) {
			uploadComplete = true;
			toast.success('Upload complete!');
		}
		// Error toast is handled by uploadWithProgress
	}
</script>

<PageCard title="Web App Uploader" description={`Current Version: ${ver}`} icon={CloudUpload}>
	<div
		class="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-200 ease-in-out"
		class:border-primary={dragActive}
		ondragenter={handleDrag}
		ondragleave={handleDrag}
		ondragover={handleDrag}
		ondrop={handleDrop}
		role="button"
		tabindex="0"
	>
		<input
			type="file"
			id="otafile"
			name="otafile"
			class="hidden"
			onchange={handleChange}
			accept=".bin"
		/>
		<label for="otafile" class="cursor-pointer">
			{#if file}
				<FileSearch size={48} class="text-primary mx-auto mb-2" />
				<p class="text-sm font-medium">{file.name}</p>
			{:else}
				<Upload size={48} class="mx-auto mb-2 text-gray-400" />
				<p class="text-sm font-medium">Drag & drop a .bin file or click to browse</p>
			{/if}
		</label>
	</div>

	{#if isUploading}
		<div class="mt-4">
			<p class="mt-2 text-center text-sm">Uploading: {Math.floor(uploadProgress)}%</p>
		</div>
	{:else if uploadComplete}
		<div class="mt-4 text-center text-green-600">
			<CircleCheck size={24} class="mx-auto mb-2" />
			<p class="text-sm font-medium">Upload complete! Reconnect and refresh if needed.</p>
		</div>
	{/if}

	{#snippet footerContent()}
		<div class="border-border py-4">
			<Button
				onclick={startUpload}
				disabled={!file || isUploading}
				variant="primary"
				class="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold shadow-lg transition-all duration-200"
			>
				{#if isUploading}
					Uploading...
				{:else}
					Upload Firmware
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
