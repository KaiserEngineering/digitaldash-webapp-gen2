import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';
import { devConfig } from '$local/mock/devDefaults';
import { isVercelDeployment } from '$lib/config';

// Check if we're in a Vercel/serverless environment
const isVercelEnvironment = isVercelDeployment;

// In-memory storage for demo (Vercel environment)
let inMemoryConfig: DigitalDash | null = null;

// SQLite database for local development
let db: any = null;
if (!isVercelEnvironment) {
	try {
		const Database = require('better-sqlite3');
		db = new Database('data.sqlite', { verbose: console.log });
		db.exec(`
			CREATE TABLE IF NOT EXISTS config (
				id INTEGER PRIMARY KEY,
				key TEXT UNIQUE,
				value TEXT
			);
		`);
	} catch (error) {
		console.warn('SQLite not available, using in-memory storage');
	}
}

const CONFIG_KEY = 'digitaldash';

export const configStore = {
	async get(): Promise<DigitalDash | null> {
		// For Vercel/demo: use in-memory storage
		if (isVercelEnvironment || !db) {
			if (!inMemoryConfig) {
				// Initialize with dev config
				const configCopy = JSON.parse(JSON.stringify(devConfig));
				for (const view of configCopy.view) {
					view.gauge = view.gauge.map((g) => ({
						...g,
						id: crypto.randomUUID()
					}));
				}
				inMemoryConfig = configCopy;
			}
			return inMemoryConfig;
		}

		// For local development: use SQLite
		try {
			const row = db.prepare('SELECT value FROM config WHERE key = ?').get(CONFIG_KEY) as
				| { value: string }
				| undefined;
			if (row) {
				const parsed = DigitalDashSchema.safeParse(JSON.parse(row.value));
				if (parsed.success) return parsed.data;
			}
		} catch (error) {
			console.warn('Error reading from SQLite, falling back to dev config');
		}

		// Fallback: use devConfig
		const configCopy = JSON.parse(JSON.stringify(devConfig));
		for (const view of configCopy.view) {
			view.gauge = view.gauge.map((g) => ({
				...g,
				id: crypto.randomUUID()
			}));
		}

		await configStore.set(configCopy);
		return configCopy;
	},

	async set(config: unknown): Promise<boolean> {
		const parsed = DigitalDashSchema.safeParse(config);
		if (!parsed.success) return false;

		// For Vercel/demo: use in-memory storage
		if (isVercelEnvironment || !db) {
			inMemoryConfig = parsed.data;
			return true;
		}

		// For local development: use SQLite
		try {
			const json = JSON.stringify(parsed.data);
			db.prepare(
				`INSERT INTO config (key, value) VALUES (?, ?)
				 ON CONFLICT(key) DO UPDATE SET value = excluded.value`
			).run(CONFIG_KEY, json);
			return true;
		} catch (error) {
			console.warn('Error writing to SQLite, using in-memory fallback');
			inMemoryConfig = parsed.data;
			return true;
		}
	}
};
