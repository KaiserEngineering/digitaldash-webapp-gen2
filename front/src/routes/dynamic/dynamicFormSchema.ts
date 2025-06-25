import { z } from 'zod';
import { DynamicSchema } from '$schemas/digitaldash';

export const DynamicFormSchema = z.object({
	items: z.array(DynamicSchema).max(3)
});
