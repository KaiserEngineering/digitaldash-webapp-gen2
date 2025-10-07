import { json } from '@sveltejs/kit';
import { PID_DEFINITIONS } from '$local/data/pids';

export const GET = async () => {
	return json(PID_DEFINITIONS);
};
