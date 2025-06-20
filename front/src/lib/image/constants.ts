// src/lib/image/constants.ts
import { apiUrl } from '$lib/config';

export const factoryBackgroundImages = ['flare.png', 'galaxy.png'];
export const factoryThemeImages = ['bar_aurora.png', 'stock_rs.png', 'stock_st.png'];

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};

export function getFactoryImages(): string[] {
	return [...factoryBackgroundImages, ...factoryThemeImages];
}

export function getEndpointForImage(name: string): string {
	return getFactoryImages().includes(name)
		? `${apiUrl}${endpoints.factory}`
		: `${apiUrl}${endpoints.customer}`;
}
