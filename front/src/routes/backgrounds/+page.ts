// +page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const parentData = await parent();
	const options = await parentData.options;

	return { slotNames: options?.view_background || [] };
};
