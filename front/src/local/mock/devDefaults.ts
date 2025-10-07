import type { DigitalDash } from '$schemas/digitaldash';

export const devConfig: DigitalDash = {
	view: [
		{
			enable: 'Enabled',
			num_gauges: 3,
			background: 'User1',
			gauge: [
				{ theme: 'Radial', pid: 'RPM', units: 'rpm' },
				{
					theme: 'Radial',
					pid: 'Boost',
					units: 'psi'
				},
				{ theme: 'Radial', pid: 'ECT', units: 'Celsius' }
			]
		},
		{
			enable: 'Enabled',
			num_gauges: 1,
			background: 'User1',
			gauge: [
				{
					theme: 'Linear',
					pid: 'Boost',
					units: 'kPa'
				},
				{ theme: 'Stock ST', pid: 'RPM', units: 'rpm' },
				{ theme: 'Stock ST', pid: 'RPM', units: 'rpm' }
			]
		},
		{
			enable: 'Disabled',
			num_gauges: 0,
			background: 'User2',
			gauge: [
				{ theme: 'Stock ST', pid: 'RPM', units: 'rpm' },
				{ theme: 'Stock ST', pid: 'RPM', units: 'rpm' },
				{ theme: 'Stock ST', pid: 'RPM', units: 'rpm' }
			]
		}
	],
	alert: [
		{
			enable: 'Enabled',
			pid: 'RPM',
			units: 'rpm',
			message: 'This is a test of the EEPROM string saving',
			compare: 'Greater Than Or Equal To',
			threshold: 6500
		},
		{
			enable: 'Disabled',
			pid: '',
			units: '',
			message: '',
			compare: 'Equal',
			threshold: 0
		},
		{
			enable: 'Disabled',
			pid: '',
			units: '',
			message: '',
			compare: 'Equal',
			threshold: 0
		},
		{
			enable: 'Disabled',
			pid: '',
			units: '',
			message: '',
			compare: 'Equal',
			threshold: 0
		},
		{
			enable: 'Disabled',
			pid: '',
			units: '',
			message: '',
			compare: 'Equal',
			threshold: 0
		}
	],

	dynamic: [
		{
			enable: 'Enabled',
			pid: 'RPM',
			units: 'rpm',
			compare: 'Greater Than',
			threshold: 3000,
			priority: 'High',
			view_index: 0
		},
		{
			enable: 'Disabled',
			pid: '',
			units: '',
			compare: 'Equal',
			threshold: 0,
			priority: 'Medium',
			view_index: 1
		},
		{
			enable: 'Enabled',
			pid: '',
			units: '',
			compare: 'Equal',
			threshold: 0,
			priority: 'Low',
			view_index: 0
		}
	]
};
