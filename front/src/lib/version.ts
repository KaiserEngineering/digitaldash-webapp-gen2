// Version constants injected by Vite at build time
declare global {
	const __APP_VERSION__: string;
	const __BUILD_DATE__: string;
	const __BUILD_TIMESTAMP__: string;
}

export const APP_VERSION = __APP_VERSION__;
export const BUILD_DATE = __BUILD_DATE__;
export const BUILD_TIMESTAMP = parseInt(__BUILD_TIMESTAMP__);

// Formatted version for display
export const VERSION_DISPLAY = `v${APP_VERSION}`;

// Full version info object
export const VERSION_INFO = {
	version: APP_VERSION,
	buildDate: BUILD_DATE,
	buildTimestamp: BUILD_TIMESTAMP,
	display: VERSION_DISPLAY
} as const;