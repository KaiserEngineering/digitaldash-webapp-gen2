import { z } from 'zod/v4';
import { DynamicSchema } from '$schemas/digitaldash';

export const DynamicFormSchema = z.object({
	high: DynamicSchema,
	medium: DynamicSchema,
	low: DynamicSchema
});

export type DynamicFormData = z.infer<typeof DynamicFormSchema>;
