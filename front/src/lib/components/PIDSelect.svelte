<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { PIDMetadata } from '$lib/stores/PIDsStore';

	let {
		pidValue = $bindable(''),
		unitValue = $bindable(''),
		pids = [],
		disabled = false,
		pidLabel = 'PID',
		unitLabel = 'Unit',
		pidPlaceholder = 'Select PID',
		unitPlaceholder = 'Select Unit',
		onPidChange = () => {},
		onUnitChange = () => {},
		class: className = '',
		key = ''
	}: {
		pidValue?: string;
		unitValue?: string;
		pids?: PIDMetadata[];
		disabled?: boolean;
		pidLabel?: string;
		unitLabel?: string;
		pidPlaceholder?: string;
		unitPlaceholder?: string;
		onPidChange?: (pid: string) => void;
		onUnitChange?: (unit: string) => void;
		class?: string;
		key?: string;
	} = $props();

	function handlePidChange(selectedValue: string | undefined) {
		if (selectedValue) {
			pidValue = selectedValue;

			// Find the new PID data by label
			const pidData = pids.find((p) => p.label === selectedValue);

			// Keep current unit if valid for new PID, otherwise reset to first unit
			if (pidData && pidData.units.length > 0) {
				// If current unit is valid for the new PID, keep it
				if (unitValue && pidData.units.includes(unitValue)) {
					// Keep current unit - no change needed
				} else {
					// Reset to first unit if current unit is invalid or empty
					unitValue = pidData.units[0];
				}
				onUnitChange(unitValue);
			} else {
				// No units available for this PID, clear the unit
				unitValue = '';
				onUnitChange('');
			}

			onPidChange(pidValue);
		}
	}

	function handleUnitChange(selectedValue: string | undefined) {
		if (selectedValue) {
			// Get current PID data to validate unit selection
			const currentPidData = pids.find((p) => p.label === pidValue);

			// Only allow valid units for the current PID
			if (currentPidData && currentPidData.units.includes(selectedValue)) {
				unitValue = selectedValue;
				onUnitChange(unitValue);
			} else {
				// Invalid unit selected, reset to first valid unit
				if (currentPidData && currentPidData.units.length > 0) {
					unitValue = currentPidData.units[0];
					onUnitChange(unitValue);
				}
			}
		}
	}

	// Auto-select first unit for existing PIDs without units
	$effect(() => {
		if (pidValue && !unitValue) {
			const pidData = pids.find((p) => p.label === pidValue);
			if (pidData && pidData.units.length > 0) {
				unitValue = pidData.units[0];
				onUnitChange(unitValue);
			}
		}
	});
</script>

<div class={`space-y-4 ${className}`}>
	<!-- PID Selector -->
	<div class="space-y-2">
		<Label class="text-sm font-medium">{pidLabel}</Label>
		<Select.Root
			type="single"
			bind:value={pidValue}
			onValueChange={handlePidChange}
			{disabled}
		>
			<Select.Trigger class="!h-12 w-full touch-manipulation">
				<span>
					{pidValue || pidPlaceholder}
				</span>
			</Select.Trigger>
			<Select.Content>
				{#each pids as pid (pid)}
					<Select.Item value={pid.label} label={pid.label} class="py-3 text-base">
						{pid.label}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Unit Selector - Shows only when PID is selected and has units -->
	{#if pidValue}
		{@const selectedPidData = pids.find((p) => p.label === pidValue)}
		{#if selectedPidData && selectedPidData.units.length > 0}
			<div class="space-y-2">
				<Label class="text-sm font-medium">{unitLabel}</Label>
				<Select.Root type="single" bind:value={unitValue} onValueChange={handleUnitChange} {disabled}>
					<Select.Trigger class="!h-12 w-full touch-manipulation">
						<span>{unitValue || unitPlaceholder}</span>
					</Select.Trigger>
					<Select.Content>
						{#each selectedPidData.units as unit (unit)}
							<Select.Item value={unit} label={unit} class="py-3 text-base">
								{unit}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}
	{/if}
</div>
