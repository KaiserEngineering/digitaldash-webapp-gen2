<script lang="ts">
	import { FileSearch, Upload, CheckCircle, UploadCloud } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import toast from 'svelte-5-french-toast';
	import { apiUrl } from '$lib/config';
	import PageCard from '@/components/PageCard.svelte';

	let { data } = $props();
	const ver = data?.ver || 'Unknown';

	let file: File | null = $state(null);
	let dragActive = $state(false);
	let uploadProgress = $state(0);
	let uploadComplete = $state(false);

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
		if (!file.name.endsWith('.bin')) return toast.error('Only .bin files allowed.');
		if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB).');

		resetUploadState();

		try {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `${apiUrl}/firmware/web`, true);
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) uploadProgress = (e.loaded / e.total) * 100;
			};
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					uploadComplete = true;
					toast.success('Upload complete!');
				} else {
					toast.error(`Upload failed: ${xhr.statusText}`);
				}
			};
			xhr.onerror = () => toast.error('Network error.');
			xhr.ontimeout = () => toast.error('Upload timed out.');
			xhr.timeout = 120000;
			xhr.send(file);
		} catch (err) {
			console.error(err);
			toast.error('Unexpected upload error.');
		}
	}
</script>

<PageCard
	title="Firmware Uploader"
	description={`Current Firmware Version: ${ver}`}
	icon={UploadCloud}
>
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

	{#if uploadProgress > 0 && !uploadComplete}
		<div class="mt-4">
			<Progress value={uploadProgress} />
			<p class="mt-2 text-center text-sm">Uploading: {Math.floor(uploadProgress)}%</p>
		</div>
	{:else if uploadComplete}
		<div class="mt-4 text-center text-green-600">
			<CheckCircle size={24} class="mx-auto mb-2" />
			<p class="text-sm font-medium">Upload complete! Reconnect and refresh if needed.</p>
		</div>
	{/if}

	{#snippet footerContent()}
		<Button onclick={startUpload} disabled={!file || uploadProgress > 0}>
			{#if uploadProgress > 0 && !uploadComplete}
				Uploading...
			{:else}
				Upload Firmware
			{/if}
		</Button>
	{/snippet}
</PageCard>
