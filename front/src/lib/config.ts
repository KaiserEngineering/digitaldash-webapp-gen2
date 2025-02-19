export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://digitaldash.local/api' : '/api';

// Dev we hit static files directly, prod we hit the /embedded routes
export const embeddedPrefix = prod ? 'embedded/' : '';
export const factoryImageNames = ['flare.png.gz', 'galaxy.png.gz'];
