// Use import.meta.env for client/server compatibility
export const prod = import.meta.env.MODE === 'production';
export const apiUrl = '/api';

// Check if running on Vercel (these are set at build time by Vercel)
export const isVercelDeployment = !!(
	import.meta.env.VITE_VERCEL ||
	import.meta.env.VERCEL ||
	import.meta.env.VERCEL_ENV
);

// Only use device API in production AND not on Vercel (Vercel is demo mode)
export const useDeviceApi = prod && !isVercelDeployment;

export const factoryBackgroundImages: string[] = ['flare', 'galaxy'];

// Theme names are loaded dynamically from /api/options endpoint
// This allows firmware to define what themes are available
export const factoryThemeImages: string[] = []; // Populated at runtime from options

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
