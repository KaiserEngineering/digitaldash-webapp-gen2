export const prerender = false;

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		factoryImages: {
			'Black': {
				name: 'Black',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
			'Blue Purple Gradient': {
				name: 'Blue Purple Gradient',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
			'Carbon Fiber': {
				name: 'Carbon Fiber',
				size: 0,
				type: 'image/jpeg',
				lastModified: Date.now()
			},
		},
		customerImages: {}
	};
};
