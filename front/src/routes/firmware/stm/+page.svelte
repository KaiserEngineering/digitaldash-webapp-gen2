<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CircleCheck, TriangleAlert, Loader, Zap, RotateCcw } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { apiUrl } from '$lib/config';
	import toast from 'svelte-5-french-toast';
	import PageCard from '@/components/PageCard.svelte';
	import { CommandBusyError, errorFromResponse, showCommandBusyToast } from '$lib/utils/apiError';

	type FlashStatus = 'idle' | 'uploading' | 'flashing' | 'success' | 'error';

	let status = $state<FlashStatus>('idle');
	let message = $state('');
	let progress = $state(0);
	let fileInput: HTMLInputElement | undefined = $state();
	let pollingInterval: number | null = null;
	let resetStatus: 'idle' | 'resetting' = $state('idle');

	const busy = $derived(status === 'uploading' || status === 'flashing');

	function browseAndFlash() {
		if (fileInput) {
			fileInput.value = '';
			fileInput.click();
		}
	}

	async function onFileSelected() {
		const file = fileInput?.files?.[0];
		if (!file) return;
		await uploadAndFlash(file);
	}

	async function uploadAndFlash(file: File) {
		status = 'uploading';
		message = 'Sending to Digital Dash...';
		progress = 0;

		try {
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				// Upload phase: 0–50%
				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) {
						progress = (e.loaded / e.total) * 50;
					}
				};

				xhr.upload.onload = () => {
					progress = 50;
					message = 'Saving to memory...';
				};

				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve();
					} else {
						try {
							const body = JSON.parse(xhr.responseText);
							if (xhr.status === 409 || body.busy) {
								reject(new CommandBusyError(body.operation || 'command'));
								return;
							}
							reject(new Error(body.error || xhr.statusText));
						} catch {
							reject(new Error(xhr.statusText || 'Upload failed'));
						}
					}
				};

				xhr.onerror = () => reject(new Error('Network error during upload'));
				xhr.ontimeout = () => reject(new Error('Upload timed out'));
				xhr.timeout = 360000;

				xhr.open('POST', '/api/firmware/stm');
				xhr.setRequestHeader('Content-Type', 'application/octet-stream');
				xhr.send(file);
			});

			// Flash phase: poll progress and map 0–100% → 50–100% overall
			status = 'flashing';
			progress = 50;
			message = 'Starting flash...';

			pollingInterval = window.setInterval(async () => {
				try {
					const res = await fetch(`${apiUrl}/flash/progress`);
					if (!res.ok) return;
					const data = await res.json();

					progress = 50 + (data.percentage || 0) / 2;
					message = data.message || 'Flashing firmware...';

					if (data.complete === true) {
						clearInterval(pollingInterval!);
						pollingInterval = null;
						status = 'success';
						progress = 100;
						message = 'Digital Dash updated successfully!';
					} else if (data.error) {
						clearInterval(pollingInterval!);
						pollingInterval = null;
						status = 'error';
						message = data.error;
					}
				} catch {
					// transient poll error — keep trying
				}
			}, 500);

			setTimeout(() => {
				if (pollingInterval) {
					clearInterval(pollingInterval);
					pollingInterval = null;
					if (status === 'flashing') {
						status = 'error';
						message = 'Flash operation timed out';
					}
				}
			}, 300000);
		} catch (err) {
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
			status = 'error';
			message = err instanceof Error ? err.message : 'An error occurred';
			showCommandBusyToast(err);
		}
	}

	async function resetSTM32() {
		if (resetStatus === 'resetting') return;
		resetStatus = 'resetting';
		try {
			const res = await fetch('/api/reset', { method: 'POST' });
			if (res.ok) {
				toast.success('Digital Dash reset successfully!');
			} else {
				const error = await errorFromResponse(res, 'Failed to reset Digital Dash');
				if (!showCommandBusyToast(error)) {
					toast.error(error.message);
				}
			}
		} catch {
			toast.error('Network error while resetting Digital Dash');
		} finally {
			resetStatus = 'idle';
		}
	}

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
	});
</script>

<PageCard
	title="Flash Digital Dash"
	description="Select a firmware file (.bin) to update your Digital Dash. The flashing process typically takes about 2 minutes, depending on the file size. Do not turn off the vehicle while the update is in progress."
	icon={Zap}
>
	<!-- Hidden file input -->
	<input bind:this={fileInput} type="file" accept=".bin" class="hidden" onchange={onFileSelected} />

	<!-- Main action button -->
	<Button
		onclick={browseAndFlash}
		disabled={busy}
		variant="primary"
		class="flex h-12 w-full items-center justify-center gap-2 text-lg font-semibold shadow-md transition-all duration-200"
	>
		{#if busy}
			<Loader class="mr-3 h-5 w-5 animate-spin" />
			{status === 'uploading' ? 'Sending...' : 'Flashing...'}
		{:else}
			<Zap class="mr-3 h-5 w-5" />
			{status === 'error' ? 'Retry Firmware Flash' : 'Select & Flash Firmware'}
		{/if}
	</Button>

	<!-- Progress -->
	{#if busy}
		<div class="border-border bg-muted space-y-3 rounded-xl border p-4">
			<p class="flex items-center gap-3 font-medium text-blue-600">
				<Loader class="h-5 w-5 animate-spin text-blue-600" />
				{message}
			</p>
			<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full bg-blue-500 transition-all duration-300"
					style="width: {Math.floor(progress)}%"
				></div>
			</div>
			<p class="text-muted-foreground text-center text-sm">{Math.floor(progress)}% complete</p>
		</div>
	{:else if status === 'success'}
		<div class="border-border bg-muted rounded-xl border p-4">
			<p class="flex items-center gap-3 font-medium text-green-600">
				<CircleCheck class="h-5 w-5 text-green-600" />
				{message}
			</p>
			<p class="mt-2 font-bold text-orange-600">
				Digital Dash will reboot in about 30s — DO NOT POWER OFF VEHICLE
			</p>
		</div>
	{:else if status === 'error'}
		<div class="border-border bg-muted rounded-xl border p-4">
			<p class="flex items-center gap-3 font-medium text-red-600">
				<TriangleAlert class="h-5 w-5 text-red-600" />
				{message}
			</p>
		</div>
	{/if}

	{#snippet footerContent()}
		<div class="border-border flex justify-between gap-4 py-4">
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
