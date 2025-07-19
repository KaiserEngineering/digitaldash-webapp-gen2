export const prerender = false;

import { json } from '@sveltejs/kit';

const validSlots = [
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

export async function GET() {
	return json(validSlots);
}
