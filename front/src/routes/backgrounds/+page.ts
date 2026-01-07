// +page.ts
import type { PageLoad } from './$types';
import { getOptions } from '$lib/stores/optionsCache';

export const load: PageLoad = async () => {
	// Use cached data from stores - consistent with other pages
	const options = await getOptions();

	return { slotNames: options?.view_background || [] };
};
