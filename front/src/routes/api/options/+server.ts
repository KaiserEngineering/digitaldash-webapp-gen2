import { json } from '@sveltejs/kit';

export async function GET() {
	// 15 slots
	const backgroundSlots = [
		'User1',
		'User2',
		'User3',
		'User4',
		'User5',
		'User6',
		'User7',
		'User8',
		'User9',
		'User10',
		'User11',
		'User12',
		'User13',
		'User14',
		'User15'
	];

	const options = {
		view_state: ['Disabled', 'Enabled'],
		view_background: backgroundSlots,
		gauge_theme: ['Linear', 'Stock RS', 'Stock ST', 'Digital', 'Grumpy Cat', 'Radial', 'Arc', 'Graph'],
		alert_state: ['Disabled', 'Enabled'],
		alert_comparison: [
			'Less Than',
			'Less Than Or Equal To',
			'Greater Than',
			'Greater Than Or Equal To',
			'Equal',
			'Not Equal'
		],
		dynamic_state: ['Disabled', 'Enabled'],
		dynamic_priority: ['Low', 'Medium', 'High'],
		dynamic_comparison: [
			'Less Than',
			'Less Than Or Equal To',
			'Greater Than',
			'Greater Than Or Equal To',
			'Equal',
			'Not Equal'
		],
		can_bus_mode: ['Normal Mode', 'Listen Only'],
		obdii_message: ['Popup Message', 'No Message'],
		obdii_pause: ['10 Seconds', '30 Seconds', 'Until Power Cycle']
	};

	return json(options);
}
