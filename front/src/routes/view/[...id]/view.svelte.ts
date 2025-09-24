import type { DigitalDashView } from '$schemas/digitaldash';

// No complex conversion needed for view data - it's used directly
// But we can add any view-specific logic here if needed in the future

export function updateViewInConfig(config: any, viewId: number, viewData: DigitalDashView) {
	config.view[viewId] = { ...config.view[viewId], ...viewData };
	return config;
}
