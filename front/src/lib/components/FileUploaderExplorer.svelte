<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	let { uploadCallback, images } = $props();
	let files: File[] = $state([]);

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			files = Array.from(input.files);
		}
	}
</script>

<div class="space-y-4 rounded bg-white p-4 shadow-sm">
	<label class="block">
		<Input class="mt-1 cursor-pointer" type="file" multiple onchange={handleFileChange} />
	</label>

	<Button class="px-4 py-2" onclick={() => uploadCallback(files)} disabled={files.length === 0}>
		Upload
	</Button>
</div>
