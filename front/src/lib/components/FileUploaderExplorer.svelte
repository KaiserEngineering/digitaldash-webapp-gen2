<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	let { uploadCallback } = $props();
	let file: File | undefined = $state();

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			file = input.files[0];
		}
	}
</script>

<div class="space-y-4 rounded bg-white p-4 shadow-sm">
	<label class="block">
		<Input class="mt-1 cursor-pointer" type="file" onchange={handleFileChange} />
	</label>

	<Button class="px-4 py-2" onclick={() => uploadCallback(file)} disabled={file == null}>
		Upload
	</Button>
</div>
