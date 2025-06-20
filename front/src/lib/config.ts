export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';
export const useDeviceApi = prod;

// Dev we hit static files directly, prod we hit the /embedded routes
export const factoryBackgroundImages: string[] = ['flare.png', 'galaxy.png'];

export const factoryThemeImames: string[] = [
	'bar_aurora.png',
	'stock_rs.png',
	'stock_st.png'
];

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
