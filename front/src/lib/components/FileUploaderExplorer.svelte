<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		displaySize,
		FileDropZone,
		MEGABYTE,
		type FileDropZoneProps
	} from '$lib/components/ui/file-drop-zone';
	import { X, Edit } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import toast from 'svelte-5-french-toast';
	import Spinner from './Spinner.svelte';
	import * as ImageCropper from '$lib/components/ui/image-cropper';
	import { fade, scale, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	type UploadedFile = {
		name: string;
		type: string;
		size: number;
		uploadedAt: number;
		url: string;
		rawFile: File;
	};

	let { uploadCallback, slotName, onUploaded } = $props();

	let file = $state<UploadedFile | null>(null);
	let isUploading = $state(false);
	let requiresCropping = $state(false);

	let tempUrl = $derived(file?.url ?? '');

	/** Handles file selection but does NOT upload immediately */
	const onUpload: FileDropZoneProps['onUpload'] = async ([selectedFile]: File[]) => {
		if (!selectedFile) return;

		// Remove previous file if necessary
		if (file) removeFile();

		// Check if file is larger than 2MB
		const isLargeFile = selectedFile.size > 2 * MEGABYTE;
		requiresCropping = isLargeFile;

		// Create a preview URL
		const previewUrl = URL.createObjectURL(selectedFile);

		// Store file (but don't upload yet)
		file = {
			name: selectedFile.name,
			type: selectedFile.type,
			size: selectedFile.size,
			uploadedAt: Date.now(),
			url: previewUrl,
			rawFile: selectedFile
		};

		// If file is larger than 2MB, automatically trigger cropping
		if (isLargeFile) {
			setTimeout(() => triggerCropping(), 100);
		}
	};

	/** Handle rejected file */
	const onFileRejected: FileDropZoneProps['onFileRejected'] = ({ reason, file }) => {
		toast.error(`${file.name} failed to upload!: ${reason}`);
	};

	async function resizeImage(blob: Blob, width: number, height: number): Promise<Blob> {
		return new Promise((resolve) => {
			const img = new Image();
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;

			img.onload = () => {
				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob((resizedBlob) => resolve(resizedBlob!), 'image/png');
			};

			img.src = URL.createObjectURL(blob);
		});
	}

	/** Trigger cropping programmatically */
	function triggerCropping() {
		if (file?.rawFile) {
			const event = new Event('change', { bubbles: true });
			const input = document.getElementById('crop-file-input');
			if (input) {
				const fileInput = input as HTMLInputElement;
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file.rawFile);
				fileInput.files = dataTransfer.files;
				fileInput.dispatchEvent(event);
			}
		}
	}

	/** Handle cropping and update the file */
	async function handleCropped(croppedUrl: string) {
		if (!file) return;

		try {
			// Fetch new cropped image as Blob
			const croppedBlob = await fetch(croppedUrl).then((res) => res.blob());

			// Resize the image to 800x165
			const resizedBlob = await resizeImage(croppedBlob, 800, 165);

			// Update file with cropped version
			const resizedUrl = URL.createObjectURL(resizedBlob);
			file = {
				...file,
				url: resizedUrl,
				rawFile: new File([resizedBlob], file.name, { type: 'image/png' })
			};

			// After cropping, the file no longer requires cropping
			requiresCropping = false;
		} catch (error) {
			console.error('Error processing cropped image:', error);
		}
	}

	/** Upload the cropped file */
	const handleUpload = async () => {
		if (!file?.rawFile) return;

		isUploading = true;
		try {
			// Rename file to match slot name (don't add .png as it's handled by the API)
			const renamedFile = new File([file.rawFile], slotName, {
				type: file.rawFile.type
			});

			await uploadCallback(renamedFile);
			onUploaded();
		} catch (error) {
			console.error('Failed to upload file:', error);
			// Don't call onUploaded on error
		} finally {
			removeFile();
			isUploading = false;
		}
	};

	/** Reset file selection */
	function removeFile() {
		if (file) {
			URL.revokeObjectURL(file.url);
			file = null;
		}
		requiresCropping = false;
	}

	/** Cleanup memory */
	onDestroy(() => {
		if (file) {
			URL.revokeObjectURL(file.url);
		}
	});
</script>

<!-- UI Layout -->
<div class="card flex w-full flex-col gap-4 p-6">
	{#if !file}
		<div
			class="border-border bg-muted/30 hover:bg-muted/50 relative h-[80px] overflow-hidden rounded-md border border-dashed transition-colors duration-200"
			in:fade={{ duration: 300, easing: quintOut }}
			out:scale={{ duration: 200, easing: quintOut, start: 0.95 }}
		>
			<!-- File Drop Zone -->
			<FileDropZone
				{onUpload}
				{onFileRejected}
				maxFileSize={50 * MEGABYTE}
				accept="image/*"
				maxFiles={1}
				fileCount={file ? 1 : 0}
				minimal={true}
				class="flex h-full items-center justify-center text-sm"
			/>
		</div>
	{:else}
		<!-- File Preview -->
		<div
			class="bg-muted/50 border-border flex items-center justify-between gap-4 rounded-lg border p-4 backdrop-blur-sm"
			in:scale={{ duration: 300, easing: quintOut, start: 0.9 }}
			out:fade={{ duration: 200, easing: quintOut }}
		>
			<div class="flex items-center gap-4">
				<img src={file.url} alt={file.name} class="h-16 w-16 rounded-lg object-cover" />
				<div class="flex flex-col">
					<span class="font-medium">{file.name}</span>
					<span class="text-muted-foreground text-xs">{displaySize(file.size)}</span>
					{#if requiresCropping}
						<span class="text-xs font-medium text-orange-600">Cropping required (file > 2MB)</span>
					{/if}
				</div>
			</div>
			<Button class="btn cursor-pointer" variant="outline" size="icon" onclick={removeFile}>
				<X />
			</Button>
		</div>

		<!-- Crop Button -->
		<div
			in:slide={{ duration: 300, easing: quintOut }}
			out:slide={{ duration: 200, easing: quintOut }}
		>
			<Button
				class="btn {requiresCropping
					? 'bg-orange-500 hover:bg-orange-600'
					: 'bg-secondary-500 hover:bg-secondary-600'} flex cursor-pointer gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-md"
				onclick={triggerCropping}
			>
				<Edit class="mr-2 h-4 w-4" />
				{requiresCropping ? 'Crop Image (Required)' : 'Crop Image'}
			</Button>
		</div>
	{/if}

	<!-- Upload Button -->
	{#if file}
		<div
			in:slide={{ duration: 400, delay: 100, easing: quintOut }}
			out:slide={{ duration: 200, easing: quintOut }}
		>
			<Button
				class="btn to-primary-600 hover:from-primary-600 hover:to-primary-700 from-primary-500 flex
				cursor-pointer gap-2 rounded-lg bg-gradient-to-r px-6 py-3 font-semibold
				text-white shadow-md transition-all duration-300 ease-in-out
				hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
				onclick={handleUpload}
				disabled={!file || isUploading || requiresCropping}
			>
				{#if isUploading}
					<Spinner />
				{:else if requiresCropping}
					Crop Required Before Upload
				{:else}
					Upload File
				{/if}
			</Button>
		</div>
	{/if}

	<!-- Cropper Dialog -->
	<ImageCropper.Root id="crop-file-input" bind:src={tempUrl} onCropped={handleCropped}>
		<ImageCropper.Dialog>
			<ImageCropper.Cropper cropShape="rect" aspect={800 / 165} />
			<ImageCropper.Controls>
				<ImageCropper.Cancel class="bg-secondary-200 cursor-pointer" />
				<ImageCropper.Crop class="bg-secondary-200 cursor-pointer" />
			</ImageCropper.Controls>
		</ImageCropper.Dialog>
	</ImageCropper.Root>
</div>
