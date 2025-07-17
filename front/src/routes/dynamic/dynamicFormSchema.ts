import { z } from 'zod';
import { DynamicSchema } from '$schemas/digitaldash';

export const DynamicFormSchema = z.object({
	items: z.array(DynamicSchema).max(3)
});

export type DynamicFormData = z.infer<typeof DynamicFormSchema>;
