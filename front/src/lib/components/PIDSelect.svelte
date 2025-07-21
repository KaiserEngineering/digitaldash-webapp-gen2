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
			const pidData = pids.find((p) => p.label === selectedValue);

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
			const currentPidData = pids.find((p) => p.label === pidValue);

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

<div class={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
	<!-- Enhanced PID Selector -->
	<div class="space-y-3">
		<Label class="text-sm font-semibold text-slate-700">{pidLabel}</Label>
		<Select.Root type="single" bind:value={pidValue} onValueChange={handlePidChange} {disabled}>
			<Select.Trigger
				class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
					disabled
						? 'border-slate-100 bg-slate-50 text-slate-400'
						: 'border-slate-200 bg-white hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
				}`}
			>
				<span class={pidValue ? 'text-slate-800' : 'text-slate-400'}>
					{#if pidValue}
						{@const selectedPid = pids.find((p) => p.label === pidValue)}
						{selectedPid?.desc || pidValue}
					{:else}
						{pidPlaceholder}
					{/if}
				</span>
			</Select.Trigger>
			<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
				{#each pids as pid (pid)}
					<Select.Item
						value={pid.label}
						label={pid.desc}
						class="rounded-lg py-3 text-base hover:bg-emerald-50"
					>
						<div class="flex flex-col">
							<span class="font-medium">{pid.desc}</span>
							<span class="text-xs text-slate-500">{pid.label}</span>
						</div>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Enhanced Unit Selector -->
	{#if pidValue}
		{@const selectedPidData = pids.find((p) => p.label === pidValue)}
		{#if selectedPidData && selectedPidData.units.length > 0}
			<div class="space-y-3">
				<Label class="text-sm font-semibold text-slate-700">{unitLabel}</Label>
				<Select.Root
					type="single"
					bind:value={unitValue}
					onValueChange={handleUnitChange}
					{disabled}
				>
					<Select.Trigger
						class={`h-12 w-full rounded-xl border-2 transition-all duration-200 ${
							disabled
								? 'border-slate-100 bg-slate-50 text-slate-400'
								: 'border-slate-200 bg-white hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
						}`}
					>
						<span class={unitValue ? 'text-slate-800' : 'text-slate-400'}>
							{unitValue || unitPlaceholder}
						</span>
					</Select.Trigger>
					<Select.Content class="rounded-xl border-2 border-slate-200 shadow-xl">
						{#each selectedPidData.units as unit (unit)}
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
		{/if}
	{/if}
</div>
