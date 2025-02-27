<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import Spinner from './Spinner.svelte';

	let { uploadCallback } = $props();
	let file: File | undefined = $state();
	let isUploading = $state(false);

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			file = input.files[0];
		}
	}

	async function handleUpload() {
		if (!file) return;
		isUploading = true;
		try {
			await uploadCallback(file);
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="space-y-4 rounded bg-white p-4 shadow-xs">
	<label class="block">
		<Input class="mt-1 cursor-pointer" type="file" onchange={handleFileChange} />
	</label>

	<Button
		class="flex items-center gap-2 px-4 py-2"
		onclick={handleUpload}
		disabled={!file || isUploading}
	>
		{#if isUploading}
			<Spinner />
		{:else}
			Upload
		{/if}
	</Button>
</div>
