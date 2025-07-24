// Safe way to access process.env in both server and client environments
const getEnv = (key: string): string | undefined => {
	if (typeof process !== 'undefined' && process.env) {
		return process.env[key];
	}
	return undefined;
};

export const prod = getEnv('NODE_ENV') === 'production';

// Detect Vercel deployment at both build time and runtime
export const isVercelDeployment = !!(
	getEnv('VERCEL') ||
	getEnv('VERCEL_ENV') ||
	(typeof window !== 'undefined' &&
		(window.location.hostname.includes('vercel.app') ||
			window.location.hostname.includes('vercel.live')))
);

// For demo purposes, always use relative API URLs in production unless specifically on digitaldash.local
export const apiUrl = (() => {
	if (typeof window !== 'undefined') {
		// Runtime check - if we're on vercel domains, use relative URLs
		if (
			window.location.hostname.includes('vercel.app') ||
			window.location.hostname.includes('vercel.live')
		) {
			return '/api';
		}
		// If we're on digitaldash.local, use the device API
		if (window.location.hostname === 'digitaldash.local') {
			return 'http://digitaldash.local/api';
		}
	}
	// Default for build time and other cases - prefer relative URLs for safety
	return '/api';
})();

export const useDeviceApi = prod && !isVercelDeployment;

export const factoryBackgroundImages: string[] = ['flare', 'galaxy'];

// Theme names are loaded dynamically from /api/options endpoint
// This allows firmware to define what themes are available
export const factoryThemeImages: string[] = []; // Populated at runtime from options

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
