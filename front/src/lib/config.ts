export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';
export const useDeviceApi = prod;

export const factoryBackgroundImages: string[] = ['flare', 'galaxy'];

export const factoryThemeImames: string[] = ['Linear', 'Stock RS', 'Stock ST', 'Radial'];

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
