<script lang="ts">
	import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-svelte';
	import { Alert, AlertDescription } from '@/components/ui/alert';
	import { Badge } from '@/components/ui/badge';

	interface Props {
		error?: Error | string | null;
		title?: string;
		showRetry?: boolean;
		showHome?: boolean;
		variant?: 'error' | 'warning' | 'network';
		onRetry?: () => void;
	}

	let {
		error = null,
		title = 'Something went wrong',
		showRetry = true,
		showHome = true,
		variant = 'error',
		onRetry
	}: Props = $props();

	let errorMessage = $derived(() => {
		if (!error) return '';
		if (typeof error === 'string') return error;
		if (error instanceof Error) return error.message;
		return 'Unknown error occurred';
	});

	let errorDetails = $derived(() => {
		if (!error || typeof error === 'string') return '';
		if (error instanceof Error) return error.stack || '';
		return '';
	});

	let styleConfig = $derived(() => {
		switch (variant) {
			case 'network':
				return {
					borderColor: 'border-orange-200',
					bgColor: 'bg-orange-50',
					textColor: 'text-orange-800',
					badgeColor: 'bg-orange-100 text-orange-800',
					iconColor: 'bg-orange-500',
					icon: WifiOff,
					badge: 'Connection Error'
				};
			case 'warning':
				return {
					borderColor: 'border-yellow-200',
					bgColor: 'bg-yellow-50',
					textColor: 'text-yellow-800',
					badgeColor: 'bg-yellow-100 text-yellow-800',
					iconColor: 'bg-yellow-500',
					icon: AlertTriangle,
					badge: 'Warning'
				};
			default:
				return {
					borderColor: 'border-red-200',
					bgColor: 'bg-red-50',
					textColor: 'text-red-800',
					badgeColor: 'bg-red-100 text-red-800',
					iconColor: 'bg-red-500',
					icon: AlertTriangle,
					badge: 'Error'
				};
		}
	});

	function handleRetry() {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	}
</script>

{#if error}
	<Alert class="mb-4 {styleConfig.borderColor} {styleConfig.bgColor}">
		<div class="flex items-start justify-between">
			<div class="flex flex-1 items-start gap-3">
				<div class="h-3 w-3 rounded-full {styleConfig.iconColor} mt-1"></div>
				<div class="flex-1">
					<AlertDescription class={styleConfig.textColor}>
						<span class="block font-semibold">{title}</span>
						<span class="text-sm">{errorMessage}</span>

						{#if errorDetails}
							<details class="mt-2">
								<summary class="cursor-pointer text-xs {styleConfig.textColor} hover:opacity-80">
									Technical details
								</summary>
								<pre
									class="mt-1 text-xs {styleConfig.textColor} bg-opacity-50 max-h-32 overflow-auto rounded border bg-white p-2">{errorDetails}</pre>
							</details>
						{/if}
					</AlertDescription>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<Badge class="{styleConfig.badgeColor} text-xs">
					{styleConfig.badge}
				</Badge>

				<div class="flex gap-1">
					{#if showRetry}
						<button
							onclick={handleRetry}
							class="flex items-center gap-1 rounded-md bg-gray-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
							title="Retry"
						>
							<RefreshCw class="h-3 w-3" />
							Retry
						</button>
					{/if}

					{#if showHome}
						<a
							href="/"
							class="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
							title="Go Home"
						>
							<Home class="h-3 w-3" />
							Home
						</a>
					{/if}
				</div>
			</div>
		</div>
	</Alert>
{/if}
