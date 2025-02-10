export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		factoryImages: {
			'Bar (Aura)': {
				name: 'Bar (Aura)',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
			'Stock': {
				name: 'Stock',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
			'Stock RS': {
				name: 'Stock RS',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
		},
		customerImages: {}
	};
};
