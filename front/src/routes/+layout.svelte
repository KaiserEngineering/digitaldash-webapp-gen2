<!-- +layout.svelte -->
<script lang="ts">
	import '../app.css';
	import Header from '@/components/Header.svelte';
	import Footer from '@/components/Footer.svelte';
	import { Toaster } from 'svelte-5-french-toast';
	import LoadingState from '$lib/components/LoadingState.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import RecoveryBanner from '$lib/components/RecoveryBanner.svelte';
	import { recoveryStore } from '$lib/stores/recoveryMode';
	import { parseApiError } from '$lib/utils/errorHandling';

	let { children, data } = $props();

	function handleMainErrorRetry() {
		window.location.reload();
	}
</script>

<div class="soft flex h-screen flex-col">
	{#await Promise.all([data.config, data.options, data.pids])}
		<!-- Enhanced loading screen -->
		<LoadingState 
			title="Loading Digital Dash"
			subtitle="Connecting to your device and loading configuration..."
		/>
	{:then}
		<!-- App layout after data is ready -->
		<div class="soft flex h-screen flex-col">
			<Toaster 
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: 'background: #363636; color: #fff; border-radius: 8px;'
				}}
			/>
			<RecoveryBanner recovery={$recoveryStore} />
			<Header />

			<main class="container mx-auto flex-1 px-2 py-2 sm:px-4 sm:py-3">
				{@render children()}
			</main>

			<Footer />
		</div>
	{:catch err}
		<!-- Enhanced error screen -->
		<div class="flex h-screen flex-col">
			<div class="flex-1 flex items-center justify-center p-4">
				<div class="max-w-2xl w-full">
					<ErrorBoundary 
						error={parseApiError(err)}
						title="Failed to load Digital Dash"
						variant="network"
						onRetry={handleMainErrorRetry}
						showHome={false}
					/>
					
					<div class="mt-6 text-center">
						<p class="text-sm text-gray-500 mb-4">
							Make sure your DigitalDash device is powered on and connected to the network.
						</p>
						
						<div class="flex justify-center gap-3">
							<button
								onclick={handleMainErrorRetry}
								class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
							>
								Try Again
							</button>
							<a
								href="/firmware"
								class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
							>
								Update Firmware
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/await}
</div>
