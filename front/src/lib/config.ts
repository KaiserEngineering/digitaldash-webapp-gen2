export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';

// Dev we hit static files directly, prod we hit the /embedded routes
export const factoryBackgroundImages: string[] = ['flare.png.gz', 'galaxy.png.gz'];

export const factoryThemeImames: string[] = [
	'bar_aurora.png.gz',
	'stock_rs.png.gz',
	'stock_st.png.gz'
];

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
