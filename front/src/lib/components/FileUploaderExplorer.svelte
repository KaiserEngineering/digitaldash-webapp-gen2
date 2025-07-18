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

	let tempUrl = $derived(file?.url ?? '');

	/** Handles file selection but does NOT upload immediately */
	const onUpload: FileDropZoneProps['onUpload'] = async ([selectedFile]: File[]) => {
		if (!selectedFile) return;

		// Remove previous file if necessary
		if (file) removeFile();

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

				canvas.toBlob((resizedBlob) => resolve(resizedBlob!), blob.type);
			};

			img.src = URL.createObjectURL(blob);
		});
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
			file = {
				...file,
				url: croppedUrl,
				rawFile: new File([resizedBlob], file.name, { type: file.type })
			};
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
			console.log('FileUploaderExplorer: uploading with slotName:', slotName);
			const renamedFile = new File([file.rawFile], slotName, {
				type: file.rawFile.type
			});
			console.log('FileUploaderExplorer: created file with name:', renamedFile.name);

			await uploadCallback(renamedFile);
		} catch (error) {
			console.error('Failed to upload file:', error);
		} finally {
			removeFile();
			isUploading = false;
		}
		isUploading = false;
		onUploaded();
	};

	/** Reset file selection */
	function removeFile() {
		if (file) {
			URL.revokeObjectURL(file.url);
			file = null;
		}
	}

	/** Cleanup memory */
	onDestroy(() => {
		if (file) {
			URL.revokeObjectURL(file.url);
		}
	});
</script>

<!-- UI Layout -->
<div class="flex w-full flex-col gap-4 rounded bg-white p-6 shadow">
	{#if !file}
		<div
			class="relative h-[80px] overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50"
			in:fade={{ duration: 300, easing: quintOut }}
			out:scale={{ duration: 200, easing: quintOut, start: 0.95 }}
		>
			<!-- File Drop Zone -->
			<FileDropZone
				{onUpload}
				{onFileRejected}
				maxFileSize={2 * MEGABYTE}
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
			class="flex items-center justify-between gap-4 rounded-lg bg-gray-100 p-4"
			in:scale={{ duration: 300, easing: quintOut, start: 0.9 }}
			out:fade={{ duration: 200, easing: quintOut }}
		>
			<div class="flex items-center gap-4">
				<img src={file.url} alt={file.name} class="h-16 w-16 rounded-lg object-cover" />
				<div class="flex flex-col">
					<span class="font-medium">{file.name}</span>
					<span class="text-xs text-gray-500">{displaySize(file.size)}</span>
				</div>
			</div>
			<Button class="btn cursor-pointer" variant="outline" size="icon" onclick={removeFile}>
				<X />
			</Button>
		</div>

		<!-- Crop Button -->
		<div in:slide={{ duration: 300, easing: quintOut }} out:slide={{ duration: 200, easing: quintOut }}>
			<Button
				class="btn flex cursor-pointer gap-2 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-600"
				onclick={() => {
					if (file?.rawFile) {
						// Trigger the cropper by programmatically uploading the file
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
				}}
			>
				<Edit class="mr-2 h-4 w-4" />
				Crop Image
			</Button>
		</div>
	{/if}

	<!-- Upload Button -->
	{#if file}
		<div in:slide={{ duration: 400, delay: 100, easing: quintOut }} out:slide={{ duration: 200, easing: quintOut }}>
			<Button
				class="btn flex cursor-pointer gap-2 rounded-lg bg-gradient-to-r
				from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-md
				transition-all duration-300 ease-in-out hover:from-red-600 hover:to-red-700
				hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
				onclick={handleUpload}
				disabled={!file || isUploading}
			>
				{#if isUploading}
					<Spinner />
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
				<ImageCropper.Cancel class="cursor-pointer bg-blue-200" />
				<ImageCropper.Crop class="cursor-pointer bg-blue-200" />
			</ImageCropper.Controls>
		</ImageCropper.Dialog>
	</ImageCropper.Root>
</div>
