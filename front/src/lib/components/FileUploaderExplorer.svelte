<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	let { uploadCallback } = $props();
	let files: File[] = $state([]);

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			files = Array.from(input.files);
		}
	}
</script>

<div class="space-y-4">
	<Input class="cursor-pointer" type="file" multiple onchange={handleFileChange} />
	<Button onclick={uploadCallback} disabled={files.length === 0}>Upload</Button>
</div>
