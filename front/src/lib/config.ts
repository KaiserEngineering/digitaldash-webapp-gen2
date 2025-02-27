export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';

// Dev we hit static files directly, prod we hit the /embedded routes
export const factoryImages: Record<string, { size: number; lastModified: number; type: string }> = {
	'flare.png.gz': { size: 214210, lastModified: 1739213160, type: 'image/png' },
	'galaxy.png.gz': { size: 373404, lastModified: 1739213160, type: 'image/png' },
	'bar_aurora.png.gz': { size: 373404, lastModified: 1739213160, type: 'image/png' },
	'stock_rs.png.gz': { size: 373404, lastModified: 1739213160, type: 'image/png' },
	'stock_st.png.gz': { size: 373404, lastModified: 1739213160, type: 'image/png' }
};

export const endpoints = {
	factory: '/embedded/',
	customer: '/user_image/'
};
