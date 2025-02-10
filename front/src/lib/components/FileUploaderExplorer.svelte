<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import { apiUrl } from '$lib/config';
	import toast from 'svelte-5-french-toast';

	let { images = $bindable(), uploadURL } = $props();
	let files: File[] = $state([]);
	let successMessage = $state('');
	let errorMessage = $state('');

	/**
	 * Validate that an image file has the expected dimensions.
	 * @param file The image file.
	 * @param expectedWidth Expected width in pixels.
	 * @param expectedHeight Expected height in pixels.
	 * @returns A Promise that resolves if dimensions are correct or rejects with an error.
	 */
	function validateImageDimensions(
		file: File,
		expectedWidth: number,
		expectedHeight: number
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (event) => {
				const image = new Image();
				image.onload = () => {
					if (image.width === expectedWidth && image.height === expectedHeight) {
						resolve();
					} else {
						reject(
							new Error(
								`Image dimensions must be ${expectedWidth}x${expectedHeight}. Found: ${image.width}x${image.height}`
							)
						);
					}
				};
				image.onerror = () => reject(new Error('Invalid image file.'));
				image.src = event.target?.result as string;
			};
			reader.onerror = () => reject(new Error('Failed to read the image file.'));
			reader.readAsDataURL(file);
		});
	}

	async function handleUpload() {
		successMessage = '';
		errorMessage = '';

		for (const file of files) {
			try {
				// Validate dimensions (e.g., 800x200)
				await validateImageDimensions(file, 800, 200);

				const formData = new FormData();
				formData.append('file', file); // Append the file directly

				// Optionally, add additional metadata if needed:
				formData.append('name', file.name);
				formData.append('size', file.size.toString());
				formData.append('type', file.type);
				formData.append('lastModified', file.lastModified.toString());

				const response = await fetch(`${apiUrl}/${uploadURL}`, {
					method: 'POST',
					body: formData
					// Do not manually set the 'Content-Type' header when using FormData.
				});

				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}

				const result = await response.json();

				// Update the images object with the new file data
				images[file.name] = {
					...file,
					id: result.id || undefined,
					url: result.url || undefined
				};

				successMessage = `Uploaded ${file.name} successfully!`;
				toast.success(successMessage);
			} catch (error) {
				errorMessage = (error as Error).message;
				toast.error(errorMessage);
			}
		}

		files = []; // Clear after upload
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			files = Array.from(input.files);
		}
	}
</script>

<div class="space-y-4">
	<Input class="cursor-pointer" type="file" multiple onchange={handleFileChange} />
	<Button onclick={handleUpload} disabled={files.length === 0}>Upload</Button>
</div>
