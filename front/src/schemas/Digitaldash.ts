// src/lib/schemas.ts
import { z } from 'zod';

// Constraints based on your config
const MAX_VIEWS = 3;
const GAUGES_PER_VIEW = 3;
const MAX_ALERTS = 5;
const NUM_DYNAMIC = 2;
const ALERT_MESSAGE_LEN = 64;

// Enum-like definitions
export const ViewStateEnum = z.enum(['Disabled', 'Enabled']);
export const ViewBackgroundEnum = z.enum([
	'BACKGROUND_BLACK.png',
	'BACKGROUND_FLARE.png',
	'BACKGROUND_GALAXY.png'
]);
// For alerts, we use a simple Enabled/Disabled enum.
export const AlertStateEnum = z.enum(['Disabled', 'Enabled']);
export const AlertComparisonEnum = z.enum([
	'Less Than',
	'Less Than Or Equal To',
	'Greater Than',
	'Greater Than Or Equal To',
	'Equal',
	'Not Equal'
]);
// For dynamic conditions
export const DynamicStateEnum = z.enum(['Disabled', 'Enabled']);
export const DynamicPriorityEnum = z.enum(['Low', 'Medium', 'High']);
// For gauge themes, update to include a consistent prefix.
export const GaugeThemeEnum = z.enum(['THEME_STOCK_ST', 'THEME_STOCK_RS']);

// Schema for a gauge
export const GaugeSchema = z.object({
	index: z.number(),
	// Representing the allowed gauge count as a tuple, e.g. [3, 3]
	count: z.tuple([z.literal(GAUGES_PER_VIEW), z.literal(GAUGES_PER_VIEW)]),
	cmd: z.string(),
	name: z.string(),
	desc: z.string(),
	type: z.string(),
	dataType: z.string(),
	default: GaugeThemeEnum,
	options: z.array(GaugeThemeEnum),
	limit: z.string(),
	EEBytes: z.number(),
	// Additional fields
	theme: GaugeThemeEnum,
	pid: z.string()
});

export const GaugeArraySchema = z.object({
	items: z.array(GaugeSchema)
});

// Schema for a view
export const ViewSchema = z.object({
	index: z.number(),
	count: z.literal(MAX_VIEWS),
	name: z.string(),
	desc: z.string(),
	type: z.string(),
	dataType: z.string(),
	default: ViewStateEnum,
	options: z.array(ViewStateEnum),
	limit: z.string(),
	EEBytes: z.number(),
	// Background image must match one of the enum values
	background: ViewBackgroundEnum.optional(),
	enabled: z.boolean()
});

// Schema for an alert
export const AlertSchema = z.object({
	index: z.number(),
	count: z.literal(MAX_ALERTS),
	cmd: z.string(),
	name: z.string(),
	desc: z.string(),
	type: z.string(),
	dataType: z.string(),
	default: AlertStateEnum,
	options: z.array(AlertStateEnum),
	limit: z.string(),
	EEBytes: z.number(),
	pid: z.string(),
	message: z.string().max(ALERT_MESSAGE_LEN).optional(),
	compare: AlertComparisonEnum.optional()
});

export const AlertArraySchema = z.object({
	items: z.array(AlertSchema)
});

// Schema for a dynamic condition
// We include extra fields to allow proper binding with your API.
export const DynamicSchema = z.object({
	index: z.number(),
	count: z.literal(NUM_DYNAMIC),
	cmd: z.string(),
	name: z.string(),
	desc: z.string(),
	type: z.string(),
	dataType: z.string(),
	default: DynamicStateEnum,
	options: z.array(DynamicStateEnum),
	limit: z.string(),
	EEBytes: z.number(),
	enabled: z.boolean(),
	pid: z.string(),
	compare: z.string(),
	thresh: z.number(),
	priority: DynamicPriorityEnum
});

export const DynamicArraySchema = z.object({
	items: z.array(DynamicSchema)
});

// Schema for the global config properties
export const ConfigSchema = z.object({
	max_views: z.literal(MAX_VIEWS),
	gauges_per_view: z.literal(GAUGES_PER_VIEW),
	max_alerts: z.literal(MAX_ALERTS),
	num_dynamic: z.literal(NUM_DYNAMIC),
	alert_message_len: z.literal(ALERT_MESSAGE_LEN),
	top_level_struc: z.literal('digitaldash'),
	top_level_name: z.literal('config'),
	struct_list: z.array(z.union([z.string(), z.array(z.string())]))
});

// Global DigitalDash configuration schema, including all top-level keys
export const DigitalDashSchema = z.object({
	config: ConfigSchema,
	view: z.array(ViewSchema),
	alert: z.array(AlertSchema),
	dynamic: z.array(DynamicSchema),
	gauge: z.array(GaugeSchema)
});

export const SingleViewEditSchema = z.object({
	view: ViewSchema,
	gauges: z.array(GaugeSchema).default([]),
	alerts: z.array(AlertSchema).default([])
});

// Infer TypeScript types from schema
export type DigitalDashConfig = z.infer<typeof DigitalDashSchema>;
export type ViewType = z.infer<typeof ViewSchema>;
export type GaugeType = z.infer<typeof GaugeSchema>;
export type AlertType = z.infer<typeof AlertSchema>;
export type DynamicType = z.infer<typeof DynamicSchema>;
export type SincegleViewEditType = z.infer<typeof SingleViewEditSchema>;
