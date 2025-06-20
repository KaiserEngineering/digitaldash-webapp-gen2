// schemasFactory.ts
import { z } from 'zod';

export async function buildSchemasFromOptions() {
	const res = await fetch('/api/options');
	const options = await res.json();

	const GaugeThemeEnum = z.enum([...(options.themes as [string, ...string[]])]);
	const PIDEnum = z.enum([...(options.pids as [string, ...string[]])]);

	const GaugeSchema = z.object({
		pid: PIDEnum,
		theme: GaugeThemeEnum,
		options: z.array(GaugeThemeEnum)
	});

	return {
		GaugeSchema,
		GaugeThemeEnum,
		PIDEnum
	};
}
