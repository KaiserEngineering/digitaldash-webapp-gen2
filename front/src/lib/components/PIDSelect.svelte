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
						<div class="text-muted-foreground text-xs">{selectedPid?.desc}</div>
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
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="PID Selection Modal"
		onclick={() => (showPidModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showPidModal = false)}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-background fixed inset-x-0 top-0 z-50 h-full"
			role="document"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="border-border bg-background border-b p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-foreground text-lg font-semibold">{pidLabel} Selection</h2>
					<Button variant="ghost" size="icon" onclick={() => (showPidModal = false)}>
						<X class="h-5 w-5" />
					</Button>
				</div>
			</div>

			<!-- Scrollable PID List -->
			<div class="h-full overflow-y-auto pt-4 pb-20">
				{#each pids as pid (pid.desc)}
					<button
						class="border-border/50 hover:bg-muted/50 w-full border-b p-4 text-left transition-colors"
						onclick={() => handlePidSelect(pid.desc)}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="text-foreground font-medium">{pid.desc}</div>
								<div class="text-muted-foreground text-sm">{pid.label}</div>
								{#if pid.units.length > 0}
									<div class="text-muted-foreground mt-1 text-xs">
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
	<div
		class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Unit Selection Modal"
		onclick={() => (showUnitModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showUnitModal = false)}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-background fixed inset-x-0 top-0 z-50 h-full"
			role="document"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="border-border bg-background border-b p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<h2 class="text-foreground text-lg font-semibold">{unitLabel} Selection</h2>
					<Button variant="ghost" size="icon" onclick={() => (showUnitModal = false)}>
						<X class="h-5 w-5" />
					</Button>
				</div>
			</div>

			<!-- Scrollable Unit List -->
			<div class="h-full overflow-y-auto pt-4 pb-20">
				{#each availableUnits as unit (unit)}
					<button
						class="border-border/50 hover:bg-muted/50 w-full border-b p-4 text-left transition-colors"
						onclick={() => handleUnitSelect(unit)}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="text-foreground font-medium">{unit}</div>
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
