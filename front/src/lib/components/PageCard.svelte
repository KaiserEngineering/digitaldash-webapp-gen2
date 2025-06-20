<!-- PageCard.svelte -->
<script>
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import * as Card from '$lib/components/ui/card';

	let {
		title = 'Page Title',
		description = 'Page description',
		headerClass = 'bg-primary-50 relative m-2 rounded-2xl p-6',
		cardClass = 'border-primary-200 overflow-hidden rounded-2xl border shadow-lg',
		footerClass = 'bg-muted/50 flex justify-end gap-2',
		containerClass = 'container mx-auto max-w-4xl space-y-6 rounded p-6',
		enhance = undefined,
		children,
		icon,
		footerContent
	} = $props();
</script>

<div
	in:fly={{ y: 20, duration: 300, easing: quintOut }}
	out:fly={{ y: -20, duration: 300, easing: quintOut }}
>
	<div class="animate-in fade-in duration-300">
		<svelte:element this={enhance ? 'form' : 'div'} use:enhance={enhance} class={containerClass}>
			<Card.Root class={cardClass}>
				<Card.Header class={headerClass}>
					<Card.Title class="flex items-center gap-2">
						{@render icon?.({ class: 'h-5 w-5' })}
						{title}
					</Card.Title>
					<Card.Description>{description}</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-4">
					{@render children?.()}
				</Card.Content>

				<Card.Footer class={footerClass}>
					{#if footerContent}
						{@render footerContent()}
					{/if}
				</Card.Footer>
			</Card.Root>
		</svelte:element>
	</div>
</div>
