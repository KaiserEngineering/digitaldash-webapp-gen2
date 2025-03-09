import { z } from "zod";

// Define constraints based on config
const MAX_VIEWS = 3;
const GAUGES_PER_VIEW = 3;
const MAX_ALERTS = 5;
const NUM_DYNAMIC = 2;
const ALERT_MESSAGE_LEN = 64;

// Enum-like lists for options
const ViewStateEnum = z.enum(["Disabled", "Enabled"]);
const ViewBackgroundEnum = z.enum(["Black", "Flare"]);
const AlertStateEnum = z.enum(["Disabled", "Enabled"]);
const AlertComparisonEnum = z.enum([
  "Less Than", "Less Than Or Equal To", "Greater Than",
  "Greater Than Or Equal To", "Equal", "Not Equal"
]);
const DynamicStateEnum = z.enum(["Disabled", "Enabled"]);
const DynamicPriorityEnum = z.enum(["Low", "Medium", "High"]);
const GaugeThemeEnum = z.enum(["Stock ST", "Stock RS"]);

// Define schema for "view"
export const ViewSchema = z.object({
  index: z.boolean(),
  count: z.literal(MAX_VIEWS),
  cmd: z.string(),
  name: z.string(),
  desc: z.string(),
  type: z.string(),
  dataType: z.string(),
  default: ViewStateEnum,
  options: z.array(ViewStateEnum),
  limit: z.string(),
  EEBytes: z.number()
});

const GaugeSchema = z.object({
  index: z.boolean(),
  count: z.tuple([z.literal(MAX_VIEWS), z.literal(GAUGES_PER_VIEW)]),
  cmd: z.string(),
  name: z.string(),
  desc: z.string(),
  type: z.string(),
  dataType: z.string(),
  default: GaugeThemeEnum,
  options: z.array(GaugeThemeEnum),
  limit: z.string(),
  EEBytes: z.number()
});

const AlertSchema = z.object({
  index: z.boolean(),
  count: z.literal(MAX_ALERTS),
  cmd: z.string(),
  name: z.string(),
  desc: z.string(),
  type: z.string(),
  dataType: z.string(),
  default: AlertStateEnum,
  options: z.array(AlertStateEnum),
  limit: z.string(),
  EEBytes: z.number()
});

const DynamicSchema = z.object({
  index: z.boolean(),
  count: z.literal(NUM_DYNAMIC),
  cmd: z.string(),
  name: z.string(),
  desc: z.string(),
  type: z.string(),
  dataType: z.string(),
  default: DynamicStateEnum,
  options: z.array(DynamicStateEnum),
  limit: z.string(),
  EEBytes: z.number()
});

const ConfigSchema = z.object({
  max_views: z.literal(MAX_VIEWS),
  gauges_per_view: z.literal(GAUGES_PER_VIEW),
  max_alerts: z.literal(MAX_ALERTS),
  num_dynamic: z.literal(NUM_DYNAMIC),
  alert_message_len: z.literal(ALERT_MESSAGE_LEN),
  top_level_struc: z.literal("digitaldash"),
  top_level_name: z.literal("config"),
  struct_list: z.array(z.union([z.string(), z.array(z.string())]))
});

export const DigitalDashSchema = z.object({
  config: ConfigSchema,
  view: z.array(ViewSchema),
  alert: z.array(AlertSchema),
  dynamic: z.array(DynamicSchema),
  gauge: z.array(GaugeSchema)
});

// Infer TypeScript types from schema
export type DigitalDashConfig = z.infer<typeof DigitalDashSchema>;
