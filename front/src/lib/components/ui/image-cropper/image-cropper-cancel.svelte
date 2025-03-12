<!--
	Installed from github/ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import { type ButtonProps, Button } from '../button';
	import type { WithoutChildren } from 'bits-ui';
	import { useImageCropperCancel } from './image-cropper.svelte.js';
	import { Trash2 } from 'lucide-svelte';

	let {
		variant = 'outline',
		size = 'sm',
		...rest
	}: Omit<WithoutChildren<ButtonProps>, 'onclick'> = $props();

	const cancelState = useImageCropperCancel();
</script>

<Button {...rest} {size} {variant} onclick={cancelState.onclick}>
	<Trash2 />
	<span>Cancel</span>
</Button>
