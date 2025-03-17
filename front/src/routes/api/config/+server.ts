// src/routes/api/config/+server.ts
import { DigitalDashSchema } from '$schemas/digitaldash';
import { json } from '@sveltejs/kit';

export async function GET({ fetch }) {
	const config = {
		config: {
			max_views: 3,
			gauges_per_view: 3,
			max_alerts: 5,
			num_dynamic: 2,
			alert_message_len: 64,
			top_level_struc: 'digitaldash',
			top_level_name: 'config',
			struct_list: ['view', ['gauge'], 'alert', 'dynamic']
		},
		view: [
			{
				index: 0,
				count: 3,
				cmd: 'VIEW_CMD',
				name: 'Daily Driver',
				desc: 'Daily driving view',
				type: 'view',
				dataType: 'string',
				default: 'Enabled',
				options: ['Disabled', 'Enabled'],
				limit: 'none',
				EEBytes: 32,
				enabled: true,
				background: 'BACKGROUND_FLARE.png'
			},
			{
				index: 1,
				count: 3,
				cmd: 'VIEW_CMD',
				name: 'Galaxy View',
				desc: 'Secondary view',
				type: 'view',
				dataType: 'string',
				default: 'Enabled',
				options: ['Disabled', 'Enabled'],
				limit: 'none',
				EEBytes: 32,
				enabled: false,
				background: 'BACKGROUND_GALAXY.png'
			}
		],
		alert: [
			{
				index: 1,
				count: 5,
				cmd: 'enable',
				name: 'Alert enable',
				desc: 'Enable or disable view by index',
				type: 'list',
				dataType: 'ALERT_STATE',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: 'Reserved',
				EEBytes: 1,
				message: 'Default alert message',
				compare: 'Equal'
			},
			{
				index: 1,
				count: 5,
				cmd: 'set_threshold',
				name: 'Alert Threshold',
				desc: 'Set the threshold for the alert',
				type: 'numeric',
				dataType: 'number',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: 'none',
				EEBytes: 2,
				message: 'Threshold alert message',
				compare: 'Greater Than'
			}
		],
		dynamic: [
			{
				index: 0,
				count: 2,
				cmd: 'DYNAMIC_CMD',
				name: 'Dynamic Rule 1',
				desc: 'Rule to check RPM',
				type: 'dynamic',
				dataType: 'number',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: 'none',
				EEBytes: 16,
				enabled: true,
				pid: 'RPM',
				compare: 'Greater Than',
				thresh: 6800,
				priority: 'High'
			},
			{
				index: 1,
				count: 2,
				cmd: 'DYNAMIC_CMD',
				name: 'Dynamic Rule 2',
				desc: 'Rule to check BOOST',
				type: 'dynamic',
				dataType: 'number',
				default: 'Disabled',
				options: ['Disabled', 'Enabled'],
				limit: 'none',
				EEBytes: 16,
				enabled: false,
				pid: 'BOOST',
				compare: 'Greater Than Or Equal To',
				thresh: 25,
				priority: 'Medium'
			}
		],
		gauge: [
			{
				index: 0,
				count: [3, 3],
				cmd: 'GAUGE_CMD',
				name: 'Oil Temperature',
				desc: 'Monitors the engine oil temperature',
				type: 'gauge',
				dataType: 'number',
				default: 'THEME_STOCK_RS',
				options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
				limit: 'none',
				EEBytes: 32,
				theme: 'THEME_STOCK_RS',
				pid: 'OIL_TEMP'
			},
			{
				index: 0,
				count: [3, 3],
				cmd: 'GAUGE_CMD',
				name: 'RPM',
				desc: 'Engine revolutions per minute',
				type: 'gauge',
				dataType: 'number',
				default: 'THEME_STOCK_ST',
				options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
				limit: 'none',
				EEBytes: 32,
				theme: 'THEME_STOCK_ST',
				pid: 'RPM'
			},
			{
				index: 1,
				count: [3, 3],
				cmd: 'GAUGE_CMD',
				name: 'Oil Temperature',
				desc: 'Monitors the engine oil temperature',
				type: 'gauge',
				dataType: 'number',
				default: 'THEME_STOCK_RS',
				options: ['THEME_STOCK_ST', 'THEME_STOCK_RS'],
				limit: 'none',
				EEBytes: 32,
				theme: 'THEME_STOCK_RS',
				pid: 'OIL_TEMP'
			}
		]
	};

	const parsed = DigitalDashSchema.safeParse(config);
	if (!parsed.success) {
		console.error('Invalid configuration data', parsed.error);
		return json({ error: 'Invalid configuration data' }, { status: 500 });
	}

	return json(parsed.data);
}
