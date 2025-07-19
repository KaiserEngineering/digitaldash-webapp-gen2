<script lang="ts">
	import { Loader2, Wifi } from 'lucide-svelte';
	import Spinner from '@/components/Spinner.svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		variant?: 'default' | 'minimal' | 'network';
		showIcon?: boolean;
	}

	let {
		title = 'Loading...',
		subtitle = 'Please wait while we load your Digital Dash',
		variant = 'default',
		showIcon = true
	}: Props = $props();
</script>

{#if variant === 'minimal'}
	<div class="flex items-center justify-center gap-2 p-4">
		{#if showIcon}
			<Loader2 class="h-4 w-4 animate-spin text-gray-500" />
		{/if}
		<span class="text-sm text-gray-600">{title}</span>
	</div>
{:else if variant === 'network'}
	<div class="flex flex-col items-center justify-center gap-3 p-8">
		<div class="relative">
			<Wifi class="h-8 w-8 text-blue-500" />
			<div class="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-blue-500"></div>
		</div>
		<div class="text-center">
			<h3 class="font-medium text-gray-800">{title}</h3>
			<p class="mt-1 text-sm text-gray-500">{subtitle}</p>
		</div>
	</div>
{:else}
	<!-- Default full-screen loading -->
	<div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
		{#if showIcon}
			<Spinner />
		{/if}
		<h2 class="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
		<p class="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>

		<!-- Loading progress indicator -->
		<div class="h-1 w-64 overflow-hidden rounded-full bg-gray-200">
			<div class="h-full w-1/3 animate-pulse rounded-full bg-blue-500"></div>
		</div>

		<p class="mt-2 text-xs text-gray-400">Connecting to your DigitalDash device...</p>
	</div>
{/if}
