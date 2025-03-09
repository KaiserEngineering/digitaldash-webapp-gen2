import { DigitalDashSchema } from '$schemas/Digitaldash';

export class Config {
	data = $state({
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
		view: Array(3).fill({
			index: true,
			count: 3,
			cmd: 'enable',
			name: 'View enable',
			desc: 'Enable or disable view by index',
			type: 'list',
			dataType: 'VIEW_STATE',
			default: 'Disabled',
			options: ['Disabled', 'Enabled'],
			limit: 'Reserved',
			EEBytes: 1
		}),
		alert: Array(5).fill({
			index: true,
			count: 5,
			cmd: 'enable',
			name: 'Alert enable',
			desc: 'Enable or disable alerts',
			type: 'list',
			dataType: 'ALERT_STATE',
			default: 'Disabled',
			options: ['Disabled', 'Enabled'],
			limit: 'Reserved',
			EEBytes: 1
		}),
		dynamic: Array(2).fill({
			index: true,
			count: 2,
			cmd: 'enable',
			name: 'Dynamic enable',
			desc: 'Enable or disable dynamic gauge',
			type: 'list',
			dataType: 'DYNAMIC_STATE',
			default: 'Disabled',
			options: ['Disabled', 'Enabled'],
			limit: 'Reserved',
			EEBytes: 1
		}),
		gauge: Array(3).fill({
			index: true,
			count: [3, 3],
			cmd: 'theme',
			name: 'Gauge Theme',
			desc: 'Set the theme for gauges',
			type: 'list',
			dataType: 'GAUGE_THEME',
			default: 'Stock ST',
			options: ['Stock ST', 'Stock RS'],
			limit: 'Reserved',
			EEBytes: 1
		})
	});

	constructor() {
		// Validate config on initialization
		const result = DigitalDashSchema.safeParse(this.data);
		if (!result.success) {
			console.error('Invalid initial config:', result.error);
		}
	}

	saveConfig() {
		if (!DigitalDashSchema.safeParse(this.data).success) {
			console.error('Configuration is invalid, fix errors before saving.');
			return;
		}
		console.log('Configuration saved!', this.data);
	}
}

// Export a shared instance
export const config = new Config();
