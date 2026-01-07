// Use import.meta.env for client/server compatibility
export const prod = import.meta.env.MODE === 'production';
export const apiUrl = '/api';

// Check if running on Vercel (VITE_VERCEL must be set in Vercel environment variables)
export const isVercelDeployment = import.meta.env.VITE_VERCEL === 'true';

// For demo deployment: never use device API (always demo mode in production)
// For local device deployment: would need to set VITE_VERCEL=false or undefined
export const useDeviceApi = false; // Always demo mode for now

export const factoryBackgroundImages: string[] = ['flare', 'galaxy'];

// Theme names are loaded dynamically from /api/options endpoint
// This allows firmware to define what themes are available
export const factoryThemeImages: string[] = []; // Populated at runtime from options

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
