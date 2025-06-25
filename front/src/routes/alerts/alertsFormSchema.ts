import { z } from 'zod';
import { AlertSchema } from '$schemas/digitaldash';

export const AlertsFormSchema = z.object({
	items: z.array(AlertSchema).max(5)
});
