import { z } from 'zod';
import { AlertSchema } from '$schemas/digitaldash';

export const AlertsFormSchema = z.record(z.string(), AlertSchema);
