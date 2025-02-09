<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import { apiUrl } from '$lib/config';

	let { images = $bindable() } = $props();
	let files: File[] = $state([]);
	let successMessage = $state('');
	let errorMessage = $state('');

	async function handleUpload() {
		successMessage = '';
		errorMessage = '';

		for (const file of files) {
			try {
				const formData = new FormData();
				formData.append('file', file); // Append the file directly

				// Optionally, add additional metadata if needed:
				formData.append('name', file.name);
				formData.append('size', file.size.toString());
				formData.append('type', file.type);
				formData.append('lastModified', file.lastModified.toString());

				const response = await fetch(`${apiUrl}/rest`, {
					method: 'POST',
					body: formData
					// Note: Do not set the 'Content-Type' header manually. The browser sets it with the correct multipart boundary.
				});

				if (!response.ok) {
					throw new Error(`Upload failed for ${file.name}`);
				}

				const result = await response.json();

				// Update the images object with the new file data
				images[file.name] = {
					...file,
					id: result.id || undefined, // Assuming API may return an ID
					url: result.url || undefined // Assuming API may return a URL
				};

				successMessage = `Uploaded ${file.name} successfully!`;
			} catch (error) {
				errorMessage = (error as Error).message;
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

	{#if successMessage}
		<p class="text-green-500">{successMessage}</p>
	{/if}

	{#if errorMessage}
		<p class="text-red-500">{errorMessage}</p>
	{/if}
</div>
