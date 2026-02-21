<script lang="ts">
	import { FileSearch, Upload, CircleCheck, CloudUpload, Loader2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import toast from 'svelte-5-french-toast';
	import { apiUrl } from '$lib/config';
	import { uploadWithProgress, UPLOAD_LIMITS, validateFile } from '$lib/utils/upload';
	import PageCard from '@/components/PageCard.svelte';

	let { data } = $props();
	const ver = data?.ver || 'Unknown';

	type UploadPhase = 'idle' | 'uploading' | 'flashing' | 'rebooting' | 'complete' | 'error';

	let file: File | null = $state(null);
	let dragActive = $state(false);
	let uploadProgress = $state(0);
	let uploadPhase: UploadPhase = $state('idle');

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
		uploadPhase = 'idle';
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
		uploadPhase = 'uploading';

		const result = await uploadWithProgress(`${apiUrl}/firmware/web`, file, {
			maxSize: UPLOAD_LIMITS.FIRMWARE,
			timeout: 360000, // 6 minutes for firmware
			onProgress: (percent) => {
				uploadProgress = percent;
				// When upload hits 100%, we're waiting for flash verification
				if (percent >= 100 && uploadPhase === 'uploading') {
					uploadPhase = 'flashing';
				}
			},
			context: 'Web firmware upload'
		});

		if (result.success) {
			uploadPhase = 'rebooting';
			toast.success('Firmware updated! Device is rebooting...');
			// After a delay, show complete state
			setTimeout(() => {
				uploadPhase = 'complete';
			}, 3000);
		} else {
			uploadPhase = 'error';
		}
	}

	const isUploading = $derived(uploadPhase === 'uploading' || uploadPhase === 'flashing' || uploadPhase === 'rebooting');
	const statusMessage = $derived(() => {
		switch (uploadPhase) {
			case 'uploading': return `Uploading firmware... ${Math.floor(uploadProgress)}%`;
			case 'flashing': return 'Writing to flash...';
			case 'rebooting': return 'Rebooting device...';
			default: return '';
		}
	});
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

	{#if uploadPhase !== 'idle' && uploadPhase !== 'complete' && uploadPhase !== 'error'}
		<div class="mt-4 flex flex-col items-center gap-2">
			<Loader2 size={24} class="animate-spin text-primary" />
			<p class="text-center text-sm">{statusMessage()}</p>
		</div>
	{:else if uploadPhase === 'complete'}
		<div class="mt-4 text-center text-green-600">
			<CircleCheck size={24} class="mx-auto mb-2" />
			<p class="text-sm font-medium">Firmware updated! Reconnect and refresh when ready.</p>
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
				{#if uploadPhase === 'uploading'}
					Uploading... {Math.floor(uploadProgress)}%
				{:else if uploadPhase === 'flashing'}
					Writing to flash...
				{:else if uploadPhase === 'rebooting'}
					Rebooting...
				{:else}
					Upload Firmware
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
