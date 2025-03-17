// src/lib/config.svelte.ts
import {
	DigitalDashSchema,
	type AlertType,
	type DigitalDashConfig,
	type DynamicType,
	type GaugeType,
	type ViewType
} from '$schemas/digitaldash';

export class Config {
	// Reactive signal typed with the inferred type from your schema
	config = $state<DigitalDashConfig | null>(null);
	lastUpdated = $state<Date | null>(null);

	// Update the configuration using Zod for validation
	update(newConfig: unknown) {
		const parsed = DigitalDashSchema.safeParse(newConfig);
		if (!parsed.success) {
			// If invalid, log the error (or handle it appropriately)
			console.error('Invalid configuration data', parsed.error);
			return;
		}
		this.config = parsed.data;
		this.lastUpdated = new Date();
	}

	// Get a view by its numeric index.
	getViewById(viewId: number): ViewType | undefined {
		const cfg = this.config;
		if (!cfg) return undefined;

		return cfg ? cfg.view.find((v) => v.index === viewId) : undefined;
	}

	// Get gauges associated with a view.
	getGaugesForView(viewId: number): GaugeType[] {
		const cfg = this.config;
		return cfg ? cfg.gauge.filter((g) => g.index === viewId) : [];
	}

	// Get alerts associated with a view.
	getAlertsForView(viewId: number): AlertType[] {
		const cfg = this.config;
		return cfg ? cfg.alert.filter((a) => a.index === viewId) : [];
	}

	// Get dynamic conditions for a view.
	getDynamicForView(viewId: number): DynamicType[] {
		const cfg = this.config;
		return cfg ? cfg.dynamic.filter((d) => d.index === viewId) : [];
	}
}

// Export a singleton instance
export const ConfigStore = new Config();
