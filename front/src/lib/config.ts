export const prod = process.env.NODE_ENV === 'production';
export const apiUrl = prod ? 'http://miata.local' : '/api';
