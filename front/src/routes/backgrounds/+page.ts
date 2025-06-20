import type { PageLoad } from './$types';
import { ImageHandler } from '$lib/image/handler';

export const prerender = false;

export const load: PageLoad = async ({ fetch }) => {
	const imageHandler = new ImageHandler();

	const customerImageNames = await imageHandler.getCustomerImageNames(fetch);
	const factoryImageNames = imageHandler.getFactoryBackgroundImages();

	return {
		factoryImageNames,
		customerImageNames
	};
};
