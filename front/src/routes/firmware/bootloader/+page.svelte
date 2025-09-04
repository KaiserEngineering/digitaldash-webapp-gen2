<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		CircleCheck,
		TriangleAlert,
		Loader,
		Upload,
		FileText,
		Zap,
		RotateCcw
	} from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { apiUrl } from '$lib/config';
	import toast from 'svelte-5-french-toast';
	import PageCard from '@/components/PageCard.svelte';

	let filesStatus: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
	interface FirmwareFile {
		name: string;
		size: number;
		type: string;
	}

	let files: FirmwareFile[] = $state([]);
	let fileInput: HTMLInputElement | undefined = $state();
	let uploadStatus: 'idle' | 'uploading' | 'success' | 'error' = $state('idle');
	let flashStatus: 'idle' | 'flashing' | 'success' | 'error' = $state('idle');
	let uploadMessage = $state('');
	let flashMessage = $state('');
	let uploadProgress = $state(0);
	let flashProgress = $state(0);
	let flashPollingInterval: number | null = null;
	let resetStatus: 'idle' | 'resetting' = $state('idle');

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
		uploadMessage = 'Uploading bootloader file...';
		uploadProgress = 0;

		try {
			const xhr = new XMLHttpRequest();

			// Set up progress tracking
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) {
					uploadProgress = (e.loaded / e.total) * 100;
					uploadMessage = `Uploading bootloader file... ${Math.floor(uploadProgress)}%`;
				}
			};

			// Set up completion handlers
			xhr.onload = async () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					uploadStatus = 'success';
					uploadMessage = 'Bootloader file uploaded successfully!';
					uploadProgress = 100;

					// Reload file list and clear input
					await loadFiles();
					if (fileInput) fileInput.value = '';
				} else {
					uploadStatus = 'error';
					uploadMessage = `Upload failed: ${xhr.statusText}`;
				}
			};

			xhr.onerror = () => {
				uploadStatus = 'error';
				uploadMessage = 'Network error during upload';
			};

			xhr.ontimeout = () => {
				uploadStatus = 'error';
				uploadMessage = 'Upload timed out';
			};

			xhr.timeout = 360000; // 3 minutes

			// Make the request
			xhr.open('POST', '/api/spiffs');
			xhr.setRequestHeader('Content-Type', 'application/octet-stream');
			xhr.send(file);
		} catch (err) {
			uploadStatus = 'error';
			uploadMessage =
				err instanceof Error ? err.message : 'An error occurred during bootloader upload';
		}
	}

	async function flashFirmware() {
		flashStatus = 'flashing';
		flashMessage = 'Starting bootloader flash...';
		flashProgress = 0;

		try {
			// Start the flash process
			const flashRes = await fetch('/api/firmware/bootloader', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!flashRes.ok) {
				const flashData = await flashRes.json();
				throw new Error(flashData.message || 'Bootloader flash failed');
			}

			// Start polling for progress
			flashPollingInterval = setInterval(async () => {
				try {
					const progressRes = await fetch(`${apiUrl}/flash/progress`);
					if (progressRes.ok) {
						const progressData = await progressRes.json();
						flashProgress = progressData.percentage || 0;
						flashMessage =
							progressData.message || `Flashing bootloader... ${Math.floor(flashProgress)}%`;

						// Check if complete
						if (progressData.complete === true) {
							clearInterval(flashPollingInterval!);
							flashPollingInterval = null;
							flashStatus = 'success';
							flashMessage = 'Bootloader updated successfully!';
							flashProgress = 100;
							await loadFiles();
						} else if (progressData.error) {
							clearInterval(flashPollingInterval!);
							flashPollingInterval = null;
							flashStatus = 'error';
							flashMessage = progressData.error;
						}
					}
				} catch (progressErr) {
					console.warn('Progress polling error:', progressErr);
				}
			}, 500); // Poll every 500ms

			// Set a timeout to stop polling after 5 minutes
			setTimeout(() => {
				if (flashPollingInterval) {
					clearInterval(flashPollingInterval);
					flashPollingInterval = null;
					if (flashStatus === 'flashing') {
						flashStatus = 'error';
						flashMessage = 'Flash operation timed out';
					}
				}
			}, 300000); // 5 minutes
		} catch (err) {
			if (flashPollingInterval) {
				clearInterval(flashPollingInterval);
				flashPollingInterval = null;
			}
			flashStatus = 'error';
			flashMessage =
				err instanceof Error ? err.message : 'An error occurred during bootloader flashing';
		}
	}

	function browseFirmware() {
		fileInput?.click();
	}

	async function resetSTM32() {
		if (resetStatus === 'resetting') return;

		resetStatus = 'resetting';
		try {
			const response = await fetch('/api/reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				toast.success('Digital Dash reset successfully!');
			} else {
				const error = await response.json().catch(() => ({ error: 'Unknown error' }));
				toast.error(error.error || 'Failed to reset Digital Dash');
			}
		} catch (err) {
			console.error('Reset error:', err);
			toast.error('Network error while resetting Digital Dash');
		} finally {
			resetStatus = 'idle';
		}
	}

	onMount(() => {
		loadFiles();
	});

	onDestroy(() => {
		if (flashPollingInterval) {
			clearInterval(flashPollingInterval);
			flashPollingInterval = null;
		}
	});
</script>

<PageCard
	title="Flash Bootloader"
	description="Update the STM32 bootloader firmware. WARNING: This is an advanced operation that should only be performed if you know what you're doing. Incorrect bootloader updates can brick your device."
	icon={Zap}
>
	<!-- Hidden file input -->
	<input bind:this={fileInput} type="file" accept=".bin" class="hidden" onchange={uploadFirmware} />

	<!-- Warning Notice -->
	<div class="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
		<div class="flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-200">
				<TriangleAlert class="h-4 w-4 text-red-700" />
			</div>
			<div>
				<h3 class="font-bold text-red-800">⚠️ DANGER: Advanced Operation</h3>
				<p class="text-red-700">
					Bootloader updates can <strong>permanently damage your device</strong> if done incorrectly.
					Only proceed if you have the correct bootloader file and understand the risks.
				</p>
			</div>
		</div>
	</div>

	<!-- Upload Button -->
	<Button
		onclick={browseFirmware}
		disabled={uploadStatus === 'uploading' || flashStatus === 'flashing'}
		class="btn-primary h-12 w-full text-lg font-semibold shadow-md transition-all duration-200"
	>
		{#if uploadStatus === 'uploading'}
			<Loader class="mr-3 h-5 w-5 animate-spin" />
			Uploading Bootloader...
		{:else}
			<Upload class="mr-3 h-5 w-5" />
			Upload Bootloader File
		{/if}
	</Button>

	<!-- Upload Status -->
	{#if uploadStatus === 'success'}
		<div class="border-border bg-muted rounded-lg border p-4">
			<p class="flex items-center gap-3 font-medium text-green-600">
				<CircleCheck class="h-5 w-5 text-green-600" />
				{uploadMessage}
			</p>
		</div>
	{:else if uploadStatus === 'error'}
		<div class="border-border bg-muted rounded-lg border p-4">
			<p class="flex items-center gap-3 font-medium text-red-600">
				<TriangleAlert class="h-5 w-5 text-red-600" />
				{uploadMessage}
			</p>
		</div>
	{:else if uploadStatus === 'uploading'}
		<div class="border-border bg-muted space-y-3 rounded-lg border p-4">
			<p class="flex items-center gap-3 font-medium text-blue-600">
				<Loader class="h-5 w-5 animate-spin text-blue-600" />
				{uploadMessage}
			</p>
			<p class="text-muted-foreground text-center text-sm">
				{Math.floor(uploadProgress)}% complete
			</p>
		</div>
	{/if}

	<!-- Flash Button - only show when bootloader file exists -->
	{#if files.some((f) => f.name === 'STM32U5G9ZJTXQ_OSPI_Bootloader.bin')}
		<Button
			onclick={flashFirmware}
			disabled={uploadStatus === 'uploading' || flashStatus === 'flashing'}
			class="btn-primary h-12 w-full text-lg font-semibold shadow-md transition-all duration-200"
		>
			{#if flashStatus === 'flashing'}
				<Loader class="mr-3 h-5 w-5 animate-spin" />
				Flashing Bootloader...
			{:else}
				<Zap class="mr-3 h-5 w-5" />
				Flash Bootloader to Digital Dash
			{/if}
		</Button>

		<!-- Flash Status -->
		{#if flashStatus === 'success'}
			<div class="rounded-lg border border-green-200 bg-green-50 p-4">
				<p class="flex items-center gap-3 font-medium text-green-800">
					<CircleCheck class="h-5 w-5 text-green-600" />
					{flashMessage}
				</p>
				<p class="mt-2 font-bold text-orange-600">
					Digital Dash will reboot in 30 seconds - DO NOT POWER OFF VEHICLE
				</p>
			</div>
		{:else if flashStatus === 'error'}
			<div class="border-border bg-muted rounded-lg border p-4">
				<p class="flex items-center gap-3 font-medium text-red-600">
					<TriangleAlert class="h-5 w-5 text-red-600" />
					{flashMessage}
				</p>
			</div>
		{:else if flashStatus === 'flashing'}
			<div class="border-border bg-muted space-y-3 rounded-lg border p-4">
				<p class="flex items-center gap-3 font-medium text-blue-600">
					<Loader class="h-5 w-5 animate-spin text-blue-600" />
					{flashMessage}
				</p>
				<p class="text-muted-foreground text-center text-sm">
					{Math.floor(flashProgress)}% complete
				</p>
			</div>
		{/if}
	{/if}

	<!-- Current Firmware Files -->
	<div class="space-y-4">
		<h3 class="flex items-center gap-2 font-medium">
			<FileText class="h-5 w-5" />
			Current Bootloader Files
		</h3>
		<div class="border-border bg-muted min-h-[120px] rounded-lg border">
			{#if filesStatus === 'loading'}
				<div class="text-muted-foreground flex items-center justify-center gap-3 py-8">
					<Loader class="h-5 w-5 animate-spin" />
					<span class="font-medium">Loading files...</span>
				</div>
			{:else if filesStatus === 'error'}
				<div class="flex items-center justify-center gap-3 py-8 text-red-600">
					<TriangleAlert class="h-5 w-5" />
					<span class="font-medium">Failed to load files</span>
				</div>
			{:else if files.length === 0}
				<div class="text-muted-foreground flex items-center justify-center py-8">
					<span class="font-medium">No bootloader file found</span>
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

	{#snippet footerContent()}
		<div class="border-border bg-muted/30 flex justify-between gap-4 py-4">
			<Button
				onclick={resetSTM32}
				disabled={resetStatus === 'resetting'}
				variant="outline"
				class="h-10 text-sm font-medium"
			>
				{#if resetStatus === 'resetting'}
					<Loader class="mr-2 h-4 w-4 animate-spin" />
					Resetting...
				{:else}
					<RotateCcw class="mr-2 h-4 w-4" />
					Reset Digital Dash
				{/if}
			</Button>
		</div>
	{/snippet}
</PageCard>
