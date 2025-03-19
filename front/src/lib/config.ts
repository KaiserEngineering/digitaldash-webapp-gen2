export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';

// Dev we hit static files directly, prod we hit the /embedded routes
export const factoryBackgroundImages: string[] = ['BACKGROUND_FLARE.png', 'BACKGROUND_GALAXY.png'];

export const factoryThemeImames: string[] = [
	'THEME_BAR_AURORA.png',
	'THEME_STOCK_RS.png',
	'THEME_STOCK_ST.png'
];

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
