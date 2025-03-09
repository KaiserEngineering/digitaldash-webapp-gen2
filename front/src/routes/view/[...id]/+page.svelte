<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { ViewSchema } from '$schemas/Digitaldash';
	import { zod } from 'sveltekit-superforms/adapters';

	// Import shadcn-svelte components
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';
	let { data }: PageProps = $props();

	const viewId = data.viewId;
	const formData = data.formData;

	const { form, enhance } = superForm(formData, {
		dataType: 'json',
		SPA: true,
		validators: zod(ViewSchema)
	});
</script>

<div class="container mx-auto max-w-2xl py-10">
	<Card>
		<CardHeader>
			<CardTitle class="text-2xl font-bold">Edit View {viewId}</CardTitle>
			<CardDescription>Update the settings for this view</CardDescription>
		</CardHeader>

		<form method="POST" use:enhance>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Name</Label>
					<Input id="name" type="text" bind:value={$form.name} />
				</div>

				<div class="space-y-2">
					<Label for="desc">Description</Label>
					<Textarea id="desc" bind:value={$form.desc} rows="3" />
				</div>

				<div class="space-y-2">
					<Label for="default">Enable</Label>

					<Select.Root bind:value={$form.default} type="single">
						<Select.Trigger class="w-[180px]"></Select.Trigger>
						<Select.Content>
							{#each $form.options as option}
								<Select.Item value={option}>{option}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<Label for="dataType">Background</Label>
					<Input id="dataType" type="text" bind:value={$form.dataType} />
				</div>

				<div class="space-y-2">
					<Label for="cmd">Command</Label>
					<Input id="cmd" type="text" bind:value={$form.cmd} />
				</div>
			</CardContent>

			<CardFooter class="border-t pt-6">
				<Button type="submit" class="w-full sm:w-auto">Save View</Button>
			</CardFooter>
		</form>
	</Card>
</div>
