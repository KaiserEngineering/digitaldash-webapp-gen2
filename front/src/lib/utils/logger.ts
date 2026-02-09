export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
	module: string;
}

interface Logger {
	debug: (message: string, ...args: unknown[]) => void;
	info: (message: string, ...args: unknown[]) => void;
	warn: (message: string, ...args: unknown[]) => void;
	error: (message: string, ...args: unknown[]) => void;
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	module: string;
	message: string;
	args: unknown[];
}

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

const MAX_LOG_ENTRIES = 500;
let logEntries: LogEntry[] = [];
let subscribers: ((entries: LogEntry[]) => void)[] = [];

function notifySubscribers(): void {
	subscribers.forEach((callback) => callback(logEntries));
}

export function getLogEntries(): LogEntry[] {
	return logEntries;
}

export function clearLogs(): void {
	logEntries = [];
	notifySubscribers();
}

export function subscribeToLogs(callback: (entries: LogEntry[]) => void): () => void {
	subscribers.push(callback);
	callback(logEntries);
	return () => {
		subscribers = subscribers.filter((cb) => cb !== callback);
	};
}

function addLogEntry(entry: LogEntry): void {
	logEntries = [...logEntries, entry].slice(-MAX_LOG_ENTRIES);
	notifySubscribers();
}

function getMinLevel(): number {
	const isDev =
		typeof process !== 'undefined'
			? process.env.NODE_ENV !== 'production'
			: typeof window !== 'undefined' && window.location.hostname === 'localhost';

	return isDev ? LOG_LEVELS.debug : LOG_LEVELS.warn;
}

export function createLogger(options: LoggerOptions): Logger {
	const { module } = options;

	function log(level: LogLevel, message: string, ...args: unknown[]): void {
		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			module,
			message,
			args
		};

		if (typeof window !== 'undefined') {
			addLogEntry(entry);
		}

		if (LOG_LEVELS[level] < getMinLevel()) {
			return;
		}

		const formattedMessage = `[${module}] ${message}`;

		switch (level) {
			case 'debug':
				console.debug(formattedMessage, ...args);
				break;
			case 'info':
				console.info(formattedMessage, ...args);
				break;
			case 'warn':
				console.warn(formattedMessage, ...args);
				break;
			case 'error':
				console.error(formattedMessage, ...args);
				break;
		}
	}

	return {
		debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
		info: (message: string, ...args: unknown[]) => log('info', message, ...args),
		warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
		error: (message: string, ...args: unknown[]) => log('error', message, ...args)
	};
}
