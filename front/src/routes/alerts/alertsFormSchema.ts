import { z } from 'zod/v4';
import { AlertSchema } from '$schemas/digitaldash';

export const AlertsFormSchema = z.record(z.string(), AlertSchema);
