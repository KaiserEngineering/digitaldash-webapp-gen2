<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	let { images = $bindable() } = $props();

	let files: File[] = $state([]);

	function handleUpload() {
		files.forEach((file) => {
			const uploadedFile = {
				name: file.name,
				size: file.size,
				type: file.type,
				lastModified: file.lastModified
			};

			images[file.name] = uploadedFile;
		});

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
	<Input type="file" multiple onchange={handleFileChange} />
	<Button onclick={handleUpload} disabled={files.length === 0}>Upload</Button>
</div>
