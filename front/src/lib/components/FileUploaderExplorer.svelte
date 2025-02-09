<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import { apiUrl } from '$lib/config';

	let { images = $bindable() } = $props();
	let files: File[] = $state([]);
	let successMessage = $state('');
	let errorMessage = $state('');

	// Converts a file to Base64 for JSON compatibility
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file); // Converts file to Base64 Data URL
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	}

	async function handleUpload() {
		successMessage = '';
		errorMessage = '';

		for (const file of files) {
			try {
				const base64Content = await fileToBase64(file);

				const payload = {
					name: file.name,
					size: file.size,
					type: file.type,
					lastModified: file.lastModified,
					content: base64Content // Base64 encoded file content
				};

				const response = await fetch(`${apiUrl}/rest`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
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
