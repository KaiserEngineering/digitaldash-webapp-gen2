<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { ChevronDown, X, Check } from 'lucide-svelte';

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

	let showPidModal = $state(false);
	let showUnitModal = $state(false);

	function handlePidSelect(selectedPid: string) {
		pidValue = selectedPid;
		const pidData = pids.find((p) => p.desc === selectedPid);

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
		showPidModal = false;
	}

	function handleUnitSelect(selectedUnit: string) {
		const currentPidData = pids.find((p) => p.desc === pidValue);

		if (currentPidData && currentPidData.units.includes(selectedUnit)) {
			unitValue = selectedUnit;
			onUnitChange(unitValue);
		}
		showUnitModal = false;
	}

	const selectedPidData = $derived(pids.find((p) => p.desc === pidValue));
	const availableUnits = $derived(selectedPidData?.units || []);
</script>

<div class={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
	<!-- PID Selector Button -->
	<div class="space-y-3">
		<Label class="text-foreground text-sm font-semibold">{pidLabel}</Label>
		<Button
			variant="outline"
			onclick={() => (showPidModal = true)}
			{disabled}
			class={`h-12 w-full justify-between rounded-xl border-2 transition-all duration-200 ${
				disabled
					? 'border-border bg-muted text-muted-foreground'
					: 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400'
			}`}
		>
			<span class={pidValue ? 'text-foreground' : 'text-muted-foreground'}>
				{#if pidValue}
					{@const selectedPid = pids.find((p) => p.desc === pidValue)}
					<div class="text-left">
						<div class="font-medium">{selectedPid?.label || pidValue}</div>
						<div class="text-xs text-muted-foreground">{selectedPid?.desc}</div>
					</div>
				{:else}
					{pidPlaceholder}
				{/if}
			</span>
			<ChevronDown class="h-4 w-4 opacity-50" />
		</Button>
	</div>

	<!-- Unit Selector Button -->
	<div class="space-y-3">
		<Label class="text-foreground text-sm font-semibold">{unitLabel}</Label>
		<Button
			variant="outline"
			onclick={() => (showUnitModal = true)}
			disabled={disabled || availableUnits.length === 0}
			class={`h-12 w-full justify-between rounded-xl border-2 transition-all duration-200 ${
				disabled || availableUnits.length === 0
					? 'border-border bg-muted text-muted-foreground'
					: 'border-border bg-card hover:border-emerald-300 focus:border-emerald-400'
			}`}
		>
			<span class={unitValue ? 'text-foreground' : 'text-muted-foreground'}>
				{unitValue || unitPlaceholder}
			</span>
			<ChevronDown class="h-4 w-4 opacity-50" />
		</Button>
	</div>
</div>

<!-- PID Selection Modal -->
{#if showPidModal}
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onclick={() => (showPidModal = false)}>
		<div class="fixed inset-x-0 top-0 z-50 h-full bg-background" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="border-b border-border bg-background p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-foreground">{pidLabel} Selection</h2>
					<Button variant="ghost" size="icon" onclick={() => (showPidModal = false)}>
						<X class="h-5 w-5" />
					</Button>
				</div>
			</div>

			<!-- Scrollable PID List -->
			<div class="h-full overflow-y-auto pb-20 pt-4">
				{#each pids as pid (pid.desc)}
					<button
						class="w-full border-b border-border/50 p-4 text-left transition-colors hover:bg-muted/50"
						onclick={() => handlePidSelect(pid.desc)}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="font-medium text-foreground">{pid.label}</div>
								<div class="text-sm text-muted-foreground">{pid.desc}</div>
								{#if pid.units.length > 0}
									<div class="mt-1 text-xs text-muted-foreground">
										Units: {pid.units.join(', ')}
									</div>
								{/if}
							</div>
							{#if pidValue === pid.desc}
								<Check class="h-5 w-5 text-emerald-600" />
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Unit Selection Modal -->
{#if showUnitModal}
	<div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onclick={() => (showUnitModal = false)}>
		<div class="fixed inset-x-0 top-0 z-50 h-full bg-background" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="border-b border-border bg-background p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-foreground">{unitLabel} Selection</h2>
					<Button variant="ghost" size="icon" onclick={() => (showUnitModal = false)}>
						<X class="h-5 w-5" />
					</Button>
				</div>
			</div>

			<!-- Scrollable Unit List -->
			<div class="h-full overflow-y-auto pb-20 pt-4">
				{#each availableUnits as unit (unit)}
					<button
						class="w-full border-b border-border/50 p-4 text-left transition-colors hover:bg-muted/50"
						onclick={() => handleUnitSelect(unit)}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="font-medium text-foreground">{unit}</div>
							</div>
							{#if unitValue === unit}
								<Check class="h-5 w-5 text-emerald-600" />
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
