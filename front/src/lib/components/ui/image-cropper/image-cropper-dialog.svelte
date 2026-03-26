<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import * as Dialog from '$lib/components/ui/dialog';
	import { cn } from '$lib/utils';
	import { useImageCropperDialog } from './image-cropper.svelte.js';
	import type { ImageCropperDialogProps } from './types';

	let { children, class: className, ...rest }: ImageCropperDialogProps = $props();

	const dialogState = useImageCropperDialog();
</script>

<DialogPrimitive.Root bind:open={dialogState.rootState.open}>
	<Dialog.Content
		{...rest}
		showCloseButton={false}
		class={cn(
			'min-h-96 max-w-full rounded-none border-x-0 sm:max-w-lg sm:rounded-lg sm:border-x',
			className
		)}
	>
		<div class="flex flex-col gap-4">
			{@render children?.()}
		</div>
	</Dialog.Content>
</DialogPrimitive.Root>
