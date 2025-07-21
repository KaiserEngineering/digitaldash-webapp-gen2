export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';
export const useDeviceApi = prod;

export const factoryBackgroundImages: string[] = ['flare', 'galaxy'];

// Theme names are loaded dynamically from /api/options endpoint
// This allows firmware to define what themes are available
export const factoryThemeImages: string[] = []; // Populated at runtime from options

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
