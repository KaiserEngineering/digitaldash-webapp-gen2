<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { CheckCircle, AlertTriangle, Loader2, Upload, FileText, Zap } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let filesStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	interface FirmwareFile {
		name: string;
		size: number;
		lastModified: number;
		type: string;
	}

	let files: FirmwareFile[] = $state([]);
	let fileInput: HTMLInputElement | undefined = $state();
	let uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = $state('idle');
	let flashStatus: 'idle' | 'flashing' | 'success' | 'error' = $state('idle');
	let uploadMessage = $state('');
	let flashMessage = $state('');

	async function loadFiles() {
		filesStatus = 'loading';
		try {
			const res = await fetch('/api/spiffs');
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to load files');
			files = data.files || [];
			filesStatus = 'success';
		} catch {
			filesStatus = 'error';
			files = [];
		}
	}

	async function uploadFirmware() {
		if (!fileInput) return;
		const file = fileInput.files?.[0];
		if (!file) return;

		uploadStatus = 'uploading';
		uploadMessage = 'Uploading firmware file...';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('filename', 'digitaldash-firmware-gen2-stm32u5g.bin');

			const uploadRes = await fetch('/api/spiffs', {
				method: 'POST',
				body: formData
			});
			const uploadData = await uploadRes.json();
			if (!uploadRes.ok) throw new Error(uploadData.message || 'File upload failed');

			uploadStatus = 'success';
			uploadMessage = 'Firmware file uploaded successfully!';

			// Reload file list and clear input
			await loadFiles();
			fileInput.value = '';
		} catch (err) {
			uploadStatus = 'error';
			uploadMessage =
				err instanceof Error ? err.message : 'An error occurred during firmware upload';
		}
	}

	async function flashFirmware() {
		flashStatus = 'flashing';
		flashMessage = 'Flashing firmware to Digital Dash...';

		try {
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

			// Reload file list
			await loadFiles();
		} catch (err) {
			flashStatus = 'error';
			flashMessage =
				err instanceof Error ? err.message : 'An error occurred during firmware flashing';
		}
	}

	function browseFirmware() {
		fileInput?.click();
	}

	onMount(() => {
		loadFiles();
	});
</script>

<div class="bg-background min-h-screen p-4">
	<div class="mx-auto max-w-4xl space-y-8 pt-8">
		<!-- Firmware Update Card -->
		<Card class="bg-card shadow-lg">
			<CardHeader class="bg-primary-600 rounded-t-lg text-white">
				<CardTitle class="flex items-center gap-3 text-xl">
					<Zap class="h-6 w-6" />
					Flash Digital Dash
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">
				<div class="bg-muted border-border rounded-lg border p-4">
					<p class="text-muted-foreground text-sm">
						Browse for a firmware file (.bin) to update your Digital Dash.
					</p>
				</div>

				<!-- Hidden file input -->
				<input
					bind:this={fileInput}
					type="file"
					accept=".bin"
					class="hidden"
					onchange={uploadFirmware}
				/>

				<!-- Upload Button -->
				<Button
					onclick={browseFirmware}
					disabled={uploadStatus === 'uploading' || flashStatus === 'flashing'}
					class="btn-primary h-12 w-full text-lg font-semibold text-gray-800 shadow-md transition-all duration-200"
				>
					{#if uploadStatus === 'uploading'}
						<Loader2 class="mr-3 h-5 w-5 animate-spin" />
						Uploading Firmware...
					{:else}
						<Upload class="mr-3 h-5 w-5" />
						Upload Firmware File
					{/if}
				</Button>

				<!-- Upload Status -->
				{#if uploadStatus === 'success'}
					<div class="border-border bg-muted rounded-lg border p-4">
						<p class="text-success flex items-center gap-3 font-medium">
							<CheckCircle class="text-success h-5 w-5" />
							{uploadMessage}
						</p>
					</div>
				{:else if uploadStatus === 'error'}
					<div class="border-border bg-muted rounded-lg border p-4">
						<p class="text-error flex items-center gap-3 font-medium">
							<AlertTriangle class="text-error h-5 w-5" />
							{uploadMessage}
						</p>
					</div>
				{:else if uploadStatus === 'uploading'}
					<div class="border-border bg-muted rounded-lg border p-4">
						<p class="text-info flex items-center gap-3 font-medium">
							<Loader2 class="text-info h-5 w-5 animate-spin" />
							{uploadMessage}
						</p>
					</div>
				{/if}

				<!-- Flash Button - only show when firmware file exists -->
				{#if files.some((f) => f.name === 'digitaldash-firmware-gen2-stm32u5g.bin')}
					<Button
						onclick={flashFirmware}
						disabled={uploadStatus === 'uploading' || flashStatus === 'flashing'}
						class="btn-primary h-12 w-full text-lg font-semibold text-gray-800 shadow-md transition-all duration-200"
					>
						{#if flashStatus === 'flashing'}
							<Loader2 class="mr-3 h-5 w-5 animate-spin" />
							Flashing Digital Dash...
						{:else}
							<Zap class="mr-3 h-5 w-5" />
							Flash to Digital Dash
						{/if}
					</Button>

					<!-- Flash Status -->
					{#if flashStatus === 'success'}
						<div class="bg-primary-50 border-primary-200 rounded-lg border p-4">
							<p class="text-primary-800 flex items-center gap-3 font-medium">
								<CheckCircle class="text-primary-600 h-5 w-5" />
								{flashMessage}
							</p>
						</div>
					{:else if flashStatus === 'error'}
						<div class="border-border bg-muted rounded-lg border p-4">
							<p class="text-error flex items-center gap-3 font-medium">
								<AlertTriangle class="text-error h-5 w-5" />
								{flashMessage}
							</p>
						</div>
					{:else if flashStatus === 'flashing'}
						<div class="border-border bg-muted rounded-lg border p-4">
							<p class="text-info flex items-center gap-3 font-medium">
								<Loader2 class="text-info h-5 w-5 animate-spin" />
								{flashMessage}
							</p>
						</div>
					{/if}
				{/if}
			</CardContent>
		</Card>

		<!-- Current Firmware Info Card -->
		<Card class="bg-card shadow-lg">
			<CardHeader class="bg-primary-600 rounded-t-lg text-white">
				<CardTitle class="flex items-center gap-3 text-xl">
					<FileText class="h-6 w-6" />
					Current Firmware
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6 p-6">
				<!-- Files List Section -->
				<div class="space-y-4">
					<div class="border-border bg-muted min-h-[120px] rounded-lg border">
						{#if filesStatus === 'loading'}
							<div class="text-muted-foreground flex items-center justify-center gap-3 py-8">
								<Loader2 class="h-5 w-5 animate-spin" />
								<span class="font-medium">Loading files...</span>
							</div>
						{:else if filesStatus === 'error'}
							<div class="text-error flex items-center justify-center gap-3 py-8">
								<AlertTriangle class="h-5 w-5" />
								<span class="font-medium">Failed to load files</span>
							</div>
						{:else if files.length === 0}
							<div class="text-muted-foreground flex items-center justify-center py-8">
								<span class="font-medium">No firmware file found</span>
							</div>
						{:else}
							<div class="divide-border divide-y">
								{#each files as file, index (file.name || index)}
									<div
										class="hover:bg-background p-4 transition-colors duration-150 {index === 0
											? 'rounded-t-lg'
											: ''} {index === files.length - 1 ? 'rounded-b-lg' : ''}"
									>
										<div class="flex items-start gap-4">
											<div
												class="bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
											>
												<FileText class="text-foreground h-6 w-6" />
											</div>
											<div class="min-w-0 flex-grow">
												<h5 class="text-foreground truncate font-medium">
													{file.name || file}
												</h5>
												<div
													class="text-muted-foreground mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3"
												>
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
