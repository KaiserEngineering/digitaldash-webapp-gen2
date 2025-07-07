import { json } from '@sveltejs/kit';

export const GET = async () => {
	const dummyPIDs = [
		{
			desc: 'Engine speed',
			label: 'RPM',
			units: ['rpm'],
			min: [0],
			max: [8000],
			decimals: [0]
		},
		{
			desc: 'Vehicle speed',
			label: 'Speed',
			units: ['kmh', 'mph'],
			min: [0, 0],
			max: [240, 150],
			decimals: [0, 0]
		},
		{
			desc: 'Throttle position',
			label: 'Throttle',
			units: ['%'],
			min: [0],
			max: [100],
			decimals: [1]
		}
	];

	return json(dummyPIDs);
};
