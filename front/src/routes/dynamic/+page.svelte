<!-- Module script: Define the schema -->
<script lang="ts" module>
	import { z } from 'zod';

	// Enums (defined inline; adjust or import from your project as needed)
	export enum DynamicCompare {
		LESS_THAN,
		LESS_THAN_OR_EQUAL_TO,
		GREATER_THAN,
		GREATER_THAN_OR_EQUAL_TO,
		EQUAL,
		NOT_EQUAL
	}

	export enum PidUnits {
		RESERVED,
		PERCENT,
		CELSIUS,
		FAHRENHEIT,
		KPA,
		PSI,
		RPM,
		KMH,
		MPH,
		GRAMSEC,
		DEGREES,
		VOLTS,
		KM,
		MILES,
		SECONDS,
		RATIO,
		LPH,
		BAR,
		G_FORCE,
		NONE
	}

	// Schema for a single dynamic condition
	export const dynamicConditionSchema = z.object({
		pid: z
			.number({ invalid_type_error: 'Select a valid PID' })
			.min(1, 'PID is required'),
		units: z.nativeEnum(PidUnits),
		compare: z.nativeEnum(DynamicCompare),
		thresh: z.number()
	});

	// Schema for a view containing an id, name, and conditions
	export const viewSchema = z.object({
		id: z.string(),
		name: z.string(),
		conditions: z.array(dynamicConditionSchema)
	});

	// Schema for the entire form (an array of views)
	export const formSchema = z.object({
		views: z.array(viewSchema)
	});
  
	export type FormSchema = typeof formSchema;
</script>

<!-- Component script: Setup Superforms and helper functions -->
<script lang="ts">
	import SuperDebug, { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import { browser } from '$app/environment';
	import * as Form from '@/components/ui/form/index.js';
	import * as Select from '@/components/ui/select/index.js';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';

	// Example available options (replace with your actual data)
	const availablePids = [
		{ id: 1, name: 'Engine RPM' },
		{ id: 2, name: 'Vehicle Speed' },
		{ id: 3, name: 'Engine Load' }
	];

	const compareOperators = [
		{ value: DynamicCompare.LESS_THAN, label: '<' },
		{ value: DynamicCompare.LESS_THAN_OR_EQUAL_TO, label: '≤' },
		{ value: DynamicCompare.GREATER_THAN, label: '>' },
		{ value: DynamicCompare.GREATER_THAN_OR_EQUAL_TO, label: '≥' },
		{ value: DynamicCompare.EQUAL, label: '=' },
		{ value: DynamicCompare.NOT_EQUAL, label: '≠' }
	];

	const unitOptions = Object.entries(PidUnits)
		.filter(([key]) => isNaN(Number(key)))
		.map(([key]) => ({
			// Using numbers for values
			value: PidUnits[key as keyof typeof PidUnits],
			label: key.toLowerCase().replace(/_/g, ' ')
		}));

	// Default form data: two views with empty conditions
	let data: SuperValidated<Infer<typeof formSchema>> = {
		views: [
			{ id: '1', name: 'Daily Driver', conditions: [] },
			{ id: '2', name: 'View Two', conditions: [] }
		]
	} as any;

	// Initialize superForm with the data and schema
	const form = superForm(data, {
        dataType: 'json',
		validators: zodClient(formSchema),
		onUpdated: ({ form: f }) => {
			if (f.valid) {
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
			} else {
				toast.error('Please fix the errors in the form.');
			}
		}
	});
	const { form: formData, enhance } = form;

	// Add a new (empty) condition to a given view
	function addCondition(viewIndex: number) {
		$formData.views[viewIndex].conditions = [
			...$formData.views[viewIndex].conditions,
			{ pid: 0, units: PidUnits.NONE, compare: DynamicCompare.EQUAL, thresh: 0 }
		];
	}

	// Remove a condition from a given view by index
	function removeCondition(viewIndex: number, conditionIndex: number) {
		$formData.views[viewIndex].conditions = $formData.views[viewIndex].conditions.filter(
			(_, i) => i !== conditionIndex
		);
	}
</script>

<!-- Markup: Loop over views and their conditions -->
<form method="POST" action="/?/dynamic-conditions" class="w-2/3 space-y-6" use:enhance={enhance}>
	{#each $formData.views as view, viewIndex}
		<div class="space-y-4 border p-4 rounded-lg">
			<h2 class="text-xl font-bold">{view.name} Conditions</h2>
      
			{#each view.conditions as condition, i}
				<div class="space-y-2 rounded-lg border p-4">
					<!-- PID Field -->
					<Form.Field {form} name={`views.${viewIndex}.conditions.${i}.pid`}>
						<Form.Control>
							<Form.Label>PID</Form.Label>
							<Select.Root
								type="single"
								bind:value={$formData.views[viewIndex].conditions[i].pid}
								name={`views.${viewIndex}.conditions.${i}.pid`}
							>
								<Select.Trigger>
									{#if $formData.views[viewIndex].conditions[i].pid}
										{availablePids.find(pid => pid.id === $formData.views[viewIndex].conditions[i].pid)?.name ?? 'Select PID'}
									{:else}
										Select PID
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each availablePids as pid}
										<Select.Item value={pid.id} label={pid.name} />
									{/each}
								</Select.Content>
							</Select.Root>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
  
					<!-- Unit Field -->
					<Form.Field {form} name={`views.${viewIndex}.conditions.${i}.units`}>
						<Form.Control>
							<Form.Label>Unit</Form.Label>
							<Select.Root
								type="single"
								bind:value={$formData.views[viewIndex].conditions[i].units}
								name={`views.${viewIndex}.conditions.${i}.units`}
							>
								<Select.Trigger>
									{#if $formData.views[viewIndex].conditions[i].units}
										{unitOptions.find(u => u.value === $formData.views[viewIndex].conditions[i].units)?.label ?? 'Select Unit'}
									{:else}
										Select Unit
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each unitOptions as unit}
										<Select.Item value={unit.value} label={unit.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
  
					<!-- Operator Field -->
					<Form.Field {form} name={`views.${viewIndex}.conditions.${i}.compare`}>
						<Form.Control>
							<Form.Label>Operator</Form.Label>
							<Select.Root
								type="single"
								bind:value={$formData.views[viewIndex].conditions[i].compare}
								name={`views.${viewIndex}.conditions.${i}.compare`}
							>
								<Select.Trigger>
									{#if $formData.views[viewIndex].conditions[i].compare !== undefined &&
										$formData.views[viewIndex].conditions[i].compare !== null}
										{compareOperators.find(op => op.value === $formData.views[viewIndex].conditions[i].compare)?.label ?? 'Select Operator'}
									{:else}
										Select Operator
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each compareOperators as op}
										<Select.Item value={op.value} label={op.label} />
									{/each}
								</Select.Content>
							</Select.Root>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
  
					<!-- Threshold Field -->
					<Form.Field {form} name={`views.${viewIndex}.conditions.${i}.thresh`}>
						<Form.Control>
							<Form.Label>Threshold</Form.Label>
							<Input type="number" bind:value={$formData.views[viewIndex].conditions[i].thresh} class="w-24" />
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
  
					<!-- Remove Condition Button -->
					<Button variant="destructive" size="icon" onclick={() => removeCondition(viewIndex, i)}>
						×
					</Button>
				</div>
			{/each}
  
			<!-- Button to add a new condition for this view -->
			<Button type="button" variant="outline" onclick={() => addCondition(viewIndex)}>
				Add Condition
			</Button>
		</div>
	{/each}
  
	<Form.Button>Submit</Form.Button>

</form>