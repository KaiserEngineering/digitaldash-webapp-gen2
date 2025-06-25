<script lang="ts">
	import { cn } from '$lib/utils';

	let { class: className, size = 'default' } = $props<{
		class?: string;
		size?: 'sm' | 'default' | 'lg';
	}>();

	const sizes = {
		sm: 'h-4 w-4',
		default: 'h-6 w-6',
		lg: 'h-8 w-8'
	};
</script>

<div
	class={cn(
		'border-primary-200 border-t-primary-600 animate-spin rounded-full border-2',
		sizes[size],
		className
	)}
></div>
