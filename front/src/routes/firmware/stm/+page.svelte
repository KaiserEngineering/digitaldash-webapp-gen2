<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import {
		CheckCircle,
		AlertTriangle,
		Loader2,
		Upload,
		HardDrive,
		Trash2,
		FileText,
		Zap
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	let updateStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let updateMessage = $state('');
	let uploadStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let uploadMessage = $state('');
	let filesStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let files: any[] = $state([]);
	let fileInput: HTMLInputElement | undefined = $state();

	async function updateFirmware() {
		updateStatus = 'loading';
		updateMessage = '';
		try {
			const res = await fetch('/api/firmware/stm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Firmware update failed');
			updateStatus = 'success';
			updateMessage = data.message || 'Firmware updated successfully';
		} catch (err) {
			updateStatus = 'error';
			updateMessage = err.message || 'An error occurred';
		}
	}

	async function uploadFirmware() {
		if (!fileInput) return;
		const file = fileInput.files?.[0];
		if (!file) return;
		uploadStatus = 'loading';
		uploadMessage = '';
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('filename', 'digitaldash-firmware-gen2-stm32u5g.bin');
			const res = await fetch('/api/spiffs', {
				method: 'POST',
				body: formData
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'File upload failed');
			uploadStatus = 'success';
			uploadMessage = data.message || 'Firmware file uploaded successfully';
			// Reload file list
			await loadFiles();
			// Clear file input
			fileInput.value = '';
		} catch (err) {
			uploadStatus = 'error';
			uploadMessage = err.message || 'An error occurred during upload';
		}
	}

	async function loadFiles() {
		filesStatus = 'loading';
		try {
			const res = await fetch('/api/spiffs');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to load files');
			files = data.files || [];
			filesStatus = 'success';
		} catch (err) {
			filesStatus = 'error';
			files = [];
		}
	}

	async function deleteFile(filename: string) {
		try {
			const res = await fetch(`/api/spiffs?filename=${encodeURIComponent(filename)}`, {
				method: 'DELETE'
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to delete file');
			// Reload file list
			await loadFiles();
		} catch (err) {
			console.error('Delete error:', err);
		}
	}

	onMount(() => {
		loadFiles();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
	<div class="mx-auto max-w-4xl space-y-8 pt-8">
		<!-- Firmware Update Card -->
		<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
			<CardHeader
				class="from-secondary-600 to-secondary-700 rounded-t-lg bg-gradient-to-r text-white"
			>
				<CardTitle class="flex items-center gap-3 text-xl">
					<HardDrive class="h-6 w-6" />
					STM32 Firmware Update
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">
				<div class="bg-secondary-50 border-secondary-200 rounded-lg border p-4">
					<p class="text-secondary-800 text-sm">
						Update the STM32 firmware using the file stored in SPIFFS:
					</p>
					<code
						class="bg-secondary-100 text-secondary-900 mt-2 inline-block rounded-md px-3 py-1 font-mono text-sm"
					>
						digitaldash-firmware-gen2-stm32u5g.bin
					</code>
				</div>

				<Button
					onclick={updateFirmware}
					disabled={updateStatus === 'loading'}
					class="from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 h-12 w-full bg-gradient-to-r text-lg font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg"
				>
					{#if updateStatus === 'loading'}
						<Loader2 class="mr-3 h-5 w-5 animate-spin" />
						Updating Firmware...
					{:else}
						<HardDrive class="mr-3 h-5 w-5" />
						Update Firmware
					{/if}
				</Button>

				{#if updateStatus === 'success'}
					<div class="bg-primary-50 border-primary-200 rounded-lg border p-4">
						<p class="text-primary-800 flex items-center gap-3 font-medium">
							<CheckCircle class="text-primary-600 h-5 w-5" />
							{updateMessage}
						</p>
					</div>
				{:else if updateStatus === 'error'}
					<div class="rounded-lg border border-red-200 bg-red-50 p-4">
						<p class="flex items-center gap-3 font-medium text-red-800">
							<AlertTriangle class="h-5 w-5 text-red-600" />
							{updateMessage}
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- SPIFFS File Management Card -->
		<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
			<CardHeader class="from-primary-600 to-primary-700 rounded-t-lg bg-gradient-to-r text-white">
				<CardTitle class="flex items-center gap-3 text-xl">
					<Upload class="h-6 w-6" />
					SPIFFS File Management
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">
				<div class="bg-primary-50 border-primary-200 rounded-lg border p-4">
					<p class="text-primary-800 text-sm">
						Upload a new firmware file to replace the current one in SPIFFS. Only .bin files are
						accepted.
					</p>
				</div>

				<!-- File Upload Section -->
				<div class="space-y-4">
					<label for="firmware-file" class="block text-sm font-semibold text-slate-700">
						Select Firmware File (.bin)
					</label>
					<div
						class="hover:border-primary-400 hover:bg-primary-50 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition-all duration-200"
					>
						<div class="flex flex-col items-center gap-4 sm:flex-row">
							<input
								bind:this={fileInput}
								id="firmware-file"
								type="file"
								accept=".bin"
								class="file:bg-primary-600 hover:file:bg-primary-700 w-full flex-1 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
							/>
							<Button
								onclick={uploadFirmware}
								disabled={uploadStatus === 'loading'}
								class="bg-primary-600 hover:bg-primary-700 h-10 px-6 py-2 font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg"
							>
								{#if uploadStatus === 'loading'}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
									Uploading...
								{:else}
									<Upload class="mr-2 h-4 w-4" />
									Upload
								{/if}
							</Button>
						</div>
					</div>
				</div>

				{#if uploadStatus === 'success'}
					<div class="bg-primary-50 border-primary-200 rounded-lg border p-4">
						<p class="text-primary-800 flex items-center gap-3 font-medium">
							<CheckCircle class="text-primary-600 h-5 w-5" />
							{uploadMessage}
						</p>
					</div>
				{:else if uploadStatus === 'error'}
					<div class="rounded-lg border border-red-200 bg-red-50 p-4">
						<p class="flex items-center gap-3 font-medium text-red-800">
							<AlertTriangle class="h-5 w-5 text-red-600" />
							{uploadMessage}
						</p>
					</div>
				{/if}

				<!-- Files List Section -->
				<div class="space-y-4">
					<h4 class="flex items-center gap-2 text-lg font-semibold text-slate-700">
						<FileText class="h-5 w-5" />
						Files in SPIFFS
					</h4>

					<div class="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50">
						{#if filesStatus === 'loading'}
							<div class="flex items-center justify-center gap-3 py-8 text-slate-500">
								<Loader2 class="h-5 w-5 animate-spin" />
								<span class="font-medium">Loading files...</span>
							</div>
						{:else if filesStatus === 'error'}
							<div class="flex items-center justify-center gap-3 py-8 text-red-600">
								<AlertTriangle class="h-5 w-5" />
								<span class="font-medium">Failed to load files</span>
							</div>
						{:else if files.length === 0}
							<div class="flex items-center justify-center py-8 text-slate-500">
								<span class="font-medium">No files found</span>
							</div>
						{:else}
							<div class="divide-y divide-slate-200">
								{#each files as file, index}
									<div
										class="flex items-center justify-between p-4 transition-colors duration-150 hover:bg-white {index ===
										0
											? 'rounded-t-lg'
											: ''} {index === files.length - 1 ? 'rounded-b-lg' : ''}"
									>
										<div class="flex items-center gap-3">
											<div
												class="bg-secondary-100 flex h-10 w-10 items-center justify-center rounded-lg"
											>
												<FileText class="text-secondary-600 h-5 w-5" />
											</div>
											<div>
												<span class="font-mono text-sm font-medium text-slate-800">
													{file.name || file}
												</span>
												{#if file.size}
													<p class="mt-1 text-xs text-slate-500">
														{(file.size / 1024).toFixed(1)} KB
													</p>
												{/if}
											</div>
										</div>
										<Button
											onclick={() => deleteFile(file.name || file)}
											variant="outline"
											size="sm"
											class="h-9 w-9 border-red-200 p-0 text-red-600 transition-all duration-150 hover:border-red-300 hover:bg-red-50"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
