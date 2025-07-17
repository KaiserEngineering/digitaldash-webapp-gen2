import { z } from 'zod/v4';

/**
 * Constants – match the C config
 */
export const MAX_VIEWS = 3;
export const GAUGES_PER_VIEW = 3;
export const MAX_ALERTS = 5;
export const NUM_DYNAMIC = 3;
export const ALERT_MESSAGE_LEN = 64;

/**
 * Enums – mapped from C enums
 */
export const CompareEnum = z.enum([
	'Less Than',
	'Less Than Or Equal To',
	'Greater Than',
	'Greater Than Or Equal To',
	'Equal',
	'Not Equal'
]);

export const PriorityEnum = z.enum(['Low', 'Medium', 'High']);

/**
 * Type for referencing a PID – you can expand to include label, units, etc. if needed
 */
export const PIDRef = z.string();

/**
 * Gauge structure
 * typedef struct {
 *   GAUGE_THEME theme;
 *   PID_DATA * pid;
 * } digitaldash_gauge;
 */
export const GaugeSchema = z.object({
	theme: z.string(),
	pid: PIDRef,
	units: z.string().default('None'),
	id: z.string().optional() // Optional ID for client-side use
});

/**
 * View structure
 * typedef struct {
 *   uint8_t enable;
 *   uint8_t num_gauges;
 *   VIEW_BACKGROUND background;
 *   digitaldash_gauge gauge[GAUGES_PER_VIEW];
 * } digitaldash_view;
 */
export const ViewSchema = z.object({
	enable: z
		.union([z.enum(['Enable', 'Disable', 'Enabled', 'Disabled']), z.boolean()])
		.transform((val) => {
			if (typeof val === 'boolean') return val;
			return val === 'Enable' || val === 'Enabled';
		})
		.default(false),
	num_gauges: z.number().int(),
	background: z.string(),
	gauge: z.array(GaugeSchema).max(GAUGES_PER_VIEW),
});

/**
 * Alert structure
 * typedef struct {
 *   uint8_t enable;
 *   PID_DATA * pid;
 *   digitaldash_compare compare;
 *   float threshold;
 *   char message[ALERT_MESSAGE_LEN];
 * } digitaldash_alert;
 */
export const AlertSchema = z.object({
	enable: z
		.union([z.enum(['Enable', 'Disable', 'Enabled', 'Disabled']), z.boolean()])
		.transform((val) => {
			if (typeof val === 'boolean') return val;
			return val === 'Enable' || val === 'Enabled';
		})
		.default(false),
	pid: PIDRef,
	units: z.string().default('None'),
	compare: CompareEnum,
	threshold: z.number().nullable(),
	message: z.string().max(ALERT_MESSAGE_LEN)
});

/**
 * Dynamic structure
 * typedef struct {
 *   uint8_t enable;
 *   PID_DATA * pid;
 *   digitaldash_compare compare;
 *   float threshold;
 *   digitaldash_priority priority;
 * } digitaldash_dynamic;
 */
export const DynamicSchema = z.object({
	enable: z
		.union([z.enum(['Enable', 'Disable', 'Enabled', 'Disabled']), z.boolean()])
		.transform((val) => {
			if (typeof val === 'boolean') return val;
			return val === 'Enable' || val === 'Enabled';
		})
		.default(false),
	pid: PIDRef,
	units: z.string().default('None'),
	compare: CompareEnum,
	threshold: z.number(),
	priority: PriorityEnum,
	index: z.number().optional()
});

/**
 * Root digitaldash struct
 * typedef struct {
 *   digitaldash_view view[MAX_VIEWS];
 *   digitaldash_alert alert[MAX_ALERTS];
 *   digitaldash_dynamic dynamic[NUM_DYNAMIC];
 * } digitaldash;
 */
export const DigitalDashSchema = z.object({
	view: z.array(ViewSchema).max(MAX_VIEWS),
	alert: z.array(AlertSchema).max(MAX_ALERTS),
	dynamic: z.array(DynamicSchema).max(NUM_DYNAMIC)
});

/**
 * Inferred TypeScript types
 */
export type DigitalDash = z.infer<typeof DigitalDashSchema>;
export type DigitalDashView = z.infer<typeof ViewSchema>;
export type DigitalDashGauge = z.infer<typeof GaugeSchema>;
export type DigitalDashAlert = z.infer<typeof AlertSchema>;
export type DigitalDashDynamic = z.infer<typeof DynamicSchema>;
export type DigitalDashCompare = z.infer<typeof CompareEnum>;
export type DigitalDashPriority = z.infer<typeof PriorityEnum>;
