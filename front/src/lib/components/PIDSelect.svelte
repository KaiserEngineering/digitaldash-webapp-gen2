<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';

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
		class: className = ''
	} = $props();

	function handlePidChange(selectedValue: string | undefined) {
		if (selectedValue) {
			pidValue = selectedValue;
			const pidData = pids.find((p) => p.desc === selectedValue);

			if (pidData && pidData.units.length > 0) {
				if (unitValue && pidData.units.includes(unitValue)) {
					// Keep current unit
				} else {
					unitValue = pidData.units[0];
				}
				onUnitChange(unitValue);
			} else {
				unitValue = '';
				onUnitChange('');
			}
			onPidChange(pidValue);
		}
	}

	function handleUnitChange(selectedValue: string | undefined) {
		if (selectedValue) {
			const currentPidData = pids.find((p) => p.desc === pidValue);

			if (currentPidData && currentPidData.units.includes(selectedValue)) {
				unitValue = selectedValue;
				onUnitChange(unitValue);
			} else {
				if (currentPidData && currentPidData.units.length > 0) {
					unitValue = currentPidData.units[0];
					onUnitChange(unitValue);
				}
			}
		}
	}

	const selectedPidData = $derived(pids.find((p) => p.desc === pidValue));
	const availableUnits = $derived(selectedPidData?.units || []);
</script>

<div class={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
	<!-- Enhanced PID Selector -->
	<div class="space-y-3">
		<Label class="text-foreground text-sm font-semibold">{pidLabel}</Label>
		<Select.Root type="single" bind:value={pidValue} onValueChange={handlePidChange} {disabled}>
			<Select.Trigger
				class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
					disabled
						? 'border-border bg-muted text-muted-foreground'
						: 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
				}`}
			>
				<span class={pidValue ? 'text-foreground' : 'text-muted-foreground'}>
					{#if pidValue}
						{@const selectedPid = pids.find((p) => p.desc === pidValue)}
						{selectedPid?.desc || pidValue}
					{:else}
						{pidPlaceholder}
					{/if}
				</span>
			</Select.Trigger>
			<Select.Content class="border-border rounded-xl border-2 shadow-xl max-h-60 overscroll-contain touch-none">
				{#each pids as pid (pid)}
					<Select.Item
						value={pid.desc}
						label={pid.desc}
						class="rounded-lg py-3 text-base hover:bg-emerald-50"
					>
						<div class="flex flex-col">
							<span class="font-medium">{pid.desc}</span>
							<span class="text-muted-foreground text-xs">{pid.label}</span>
						</div>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Enhanced Unit Selector -->
	<div class="space-y-3">
		<Label class="text-foreground text-sm font-semibold">{unitLabel}</Label>
		<Select.Root
			type="single"
			bind:value={unitValue}
			onValueChange={handleUnitChange}
			disabled={disabled || availableUnits.length === 0}
		>
			<Select.Trigger
				class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
					disabled || availableUnits.length === 0
						? 'border-border bg-muted text-muted-foreground'
						: 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
				}`}
			>
				<span class={unitValue ? 'text-foreground' : 'text-muted-foreground'}>
					{unitValue || unitPlaceholder}
				</span>
			</Select.Trigger>
			<Select.Content class="border-border rounded-xl border-2 shadow-xl max-h-60 overscroll-contain touch-none">
				{#each availableUnits as unit (unit)}
					<Select.Item
						value={unit}
						label={unit}
						class="rounded-lg py-3 text-base hover:bg-emerald-50"
					>
						{unit}
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</div>
