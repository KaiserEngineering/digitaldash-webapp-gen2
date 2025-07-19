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

	let filesStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	let files: any[] = $state([]);
	let fileInput: HTMLInputElement | undefined = $state();
	let flashStatus: 'idle' | 'uploading' | 'flashing' | 'success' | 'error' = $state('idle');
	let flashMessage = $state('');


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

	async function browseAndFlashFirmware() {
		if (!fileInput) return;
		const file = fileInput.files?.[0];
		if (!file) return;

		flashStatus = 'uploading';
		flashMessage = 'Uploading firmware file...';

		try {
			// Step 1: Upload file to SPIFFS with correct name
			const formData = new FormData();
			formData.append('file', file);
			formData.append('filename', 'digitaldash-firmware-gen2-stm32u5g.bin');
			
			const uploadRes = await fetch('/api/spiffs', {
				method: 'POST',
				body: formData
			});
			const uploadData = await uploadRes.json();
			if (!uploadRes.ok) throw new Error(uploadData.message || 'File upload failed');

			// Step 2: Flash the firmware
			flashStatus = 'flashing';
			flashMessage = 'Flashing firmware to STM32...';

			const flashRes = await fetch('/api/firmware/stm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const flashData = await flashRes.json();
			if (!flashRes.ok) throw new Error(flashData.message || 'Firmware flash failed');

			flashStatus = 'success';
			flashMessage = 'Digital Dash updated successfully!';
			
			// Reload file list and clear input
			await loadFiles();
			fileInput.value = '';

		} catch (err) {
			flashStatus = 'error';
			flashMessage = err.message || 'An error occurred during firmware update';
		}
	}

	function browseFirmware() {
		fileInput?.click();
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
					<Zap class="h-6 w-6" />
					Flash Digital Dash
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">
				<div class="bg-secondary-50 border-secondary-200 rounded-lg border p-4">
					<p class="text-secondary-800 text-sm">
						Browse for a firmware file (.bin) to update your Digital Dash.
					</p>
				</div>

				<!-- Hidden file input -->
				<input
					bind:this={fileInput}
					type="file"
					accept=".bin"
					class="hidden"
					onchange={browseAndFlashFirmware}
				/>

				<Button
					onclick={browseFirmware}
					disabled={flashStatus === 'uploading' || flashStatus === 'flashing'}
					class="from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 h-12 w-full bg-gradient-to-r text-lg font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg"
				>
					{#if flashStatus === 'uploading'}
						<Loader2 class="mr-3 h-5 w-5 animate-spin" />
						Uploading Firmware...
					{:else if flashStatus === 'flashing'}
						<Loader2 class="mr-3 h-5 w-5 animate-spin" />
						Flashing Firmware...
					{:else}
						<Upload class="mr-3 h-5 w-5" />
						Browse & Flash Digital Dash
					{/if}
				</Button>

				{#if flashStatus === 'success'}
					<div class="bg-primary-50 border-primary-200 rounded-lg border p-4">
						<p class="text-primary-800 flex items-center gap-3 font-medium">
							<CheckCircle class="text-primary-600 h-5 w-5" />
							{flashMessage}
						</p>
					</div>
				{:else if flashStatus === 'error'}
					<div class="rounded-lg border border-red-200 bg-red-50 p-4">
						<p class="flex items-center gap-3 font-medium text-red-800">
							<AlertTriangle class="h-5 w-5 text-red-600" />
							{flashMessage}
						</p>
					</div>
				{:else if flashStatus === 'uploading' || flashStatus === 'flashing'}
					<div class="bg-blue-50 border-blue-200 rounded-lg border p-4">
						<p class="text-blue-800 flex items-center gap-3 font-medium">
							<Loader2 class="text-blue-600 h-5 w-5 animate-spin" />
							{flashMessage}
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Current Firmware Info Card -->
		<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
			<CardHeader class="from-primary-600 to-primary-700 rounded-t-lg bg-gradient-to-r text-white">
				<CardTitle class="flex items-center gap-3 text-xl">
					<FileText class="h-6 w-6" />
					Current Firmware
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">

				<!-- Files List Section -->
				<div class="space-y-4">

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
								<span class="font-medium">No firmware file found</span>
							</div>
						{:else}
							<div class="divide-y divide-slate-200">
								{#each files as file, index}
									<div
										class="p-4 transition-colors duration-150 hover:bg-white {index === 0 ? 'rounded-t-lg' : ''} {index === files.length - 1 ? 'rounded-b-lg' : ''}"
									>
										<div class="flex items-start gap-4">
											<div
												class="bg-secondary-100 flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0"
											>
												<FileText class="text-secondary-600 h-6 w-6" />
											</div>
											<div class="flex-grow min-w-0">
												<h5 class="font-medium text-slate-800 truncate">
													{file.name || file}
												</h5>
												<div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-600">
													{#if file.size}
														<div class="flex items-center gap-1">
															<span class="font-medium">Size:</span>
															<span>{(file.size / 1024).toFixed(1)} KB</span>
														</div>
													{/if}
													{#if file.lastModified}
														<div class="flex items-center gap-1">
															<span class="font-medium">Modified:</span>
															<span>{new Date(file.lastModified).toLocaleDateString()}</span>
														</div>
													{/if}
													{#if file.type}
														<div class="flex items-center gap-1">
															<span class="font-medium">Type:</span>
															<span>{file.type}</span>
														</div>
													{/if}
												</div>
											</div>
										</div>
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
