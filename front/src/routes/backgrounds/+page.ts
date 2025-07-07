// +page.ts
import type { PageLoad } from './$types';
import { getOptions } from '@/config/optionsCache';

export const load: PageLoad = async ({ fetch }) => {
	const options = await getOptions(fetch);
	return { slotNames: options?.view_background || [] };
};
