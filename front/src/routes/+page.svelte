<script lang="ts">
	import FileUploaderExplorer from '@/components/FileUploaderExplorer.svelte';

	function hitTheBackend() {
		fetch('/api/rest')
			.then((res) => res.json())
			.then((data) => console.log(data));
	}

	function hitTheBackendPost() {
		fetch('/api/rest', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: 'John Doe' })
		})
			.then((res) => res.json())
			.then((data) => console.log(data));
	}
</script>

<div class="mx-auto w-1/2 flex justify-between space-x-4 m-2">
    <button class="rounded bg-red-300 p-2" onclick={hitTheBackend}>Get</button>
    <button class="rounded bg-blue-300 p-2" onclick={hitTheBackendPost}>Post</button>
</div>

<div class="w-1/2 mx-auto">
	<FileUploaderExplorer />
</div>
