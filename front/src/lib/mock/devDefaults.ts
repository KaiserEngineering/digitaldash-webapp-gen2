import type { DigitalDash } from '$schemas/digitaldash';

export const devConfig: DigitalDash = {
	view: [
		{
			enabled: true,
			num_gauges: 3,
			background: 'flare.png',
			gauge: [
				{ theme: 'stock_rs', pid: 'OIL_TEMP', enabled: true },
				{ theme: 'stock_st', pid: 'COOLANT_TEMP', enabled: true },
				{ theme: 'stock_rs', pid: 'RPM', enabled: false }
			]
		},
		{
			enabled: false,
			num_gauges: 1,
			background: 'flare.png',
			gauge: [{ theme: 'stock_st', pid: 'TPS', enabled: true }]
		},
		{
			enabled: false,
			num_gauges: 2,
			background: 'galaxy.png',
			gauge: [
				{ theme: 'stock_st', pid: 'VOLTAGE', enabled: true },
				{ theme: 'stock_rs', pid: 'IAT', enabled: true }
			]
		}
	],
	num_views: 3,

	alert: [
		{
			enabled: true,
			pid: 'RPM',
			compare: 'DD_EQUAL',
			thresh: 3000,
			msg: 'Shift now!'
		},
		{
			enabled: false,
			pid: 'OIL_TEMP',
			compare: 'DD_GREATER_THAN',
			thresh: 120,
			msg: 'High oil temp'
		},
		{
			enabled: false,
			pid: 'BOOST',
			compare: 'DD_GREATER_THAN',
			thresh: 20,
			msg: 'Overboost!'
		},
		{ enabled: false, pid: 'TPS', compare: 'DD_EQUAL', thresh: 100, msg: 'WOT' },
		{ enabled: false, pid: 'MAF', compare: 'DD_LESS_THAN', thresh: 5, msg: 'Low MAF' }
	],

	dynamic: [
		{
			enabled: true,
			view_index: 0,
			pid: 'RPM',
			compare: 'DD_GREATER_THAN',
			thresh: 7000,
			priority: 'DD_HIGH_PRIORITY'
		},
		{
			enabled: false,
			view_index: 1,
			pid: 'BOOST',
			compare: 'DD_GREATER_THAN_OR_EQUAL_TO',
			thresh: 15,
			priority: 'DD_MEDIUM_PRIORITY'
		}
	]
};
