<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';

	let { children, class: className = '' } = $props();
</script>

<Card class={cn('border-0 shadow-sm transition-all duration-200 hover:shadow-md gap-2 py-2 sm:gap-4 sm:py-4', className)}>
	<CardContent class="px-0">
		{@render children?.()}
	</CardContent>
</Card>
