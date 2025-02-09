export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		factoryImages: {
			galaxy: 'Galaxy',
			dark: 'Dark',
			light: 'Light'
		},
		customerImages: {
			dog: 'Dog'
		}
	};
};
