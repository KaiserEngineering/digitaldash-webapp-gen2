// src/lib/server/db.ts
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

// Only initialize SQLite when NOT on Vercel (serverless doesn't support it)
// Check process.env at runtime (not import.meta.env which is build-time)
const isVercel = typeof process !== 'undefined' && process.env.VERCEL === '1';

if (!isVercel) {
	db = new Database('data.sqlite', { verbose: console.log });

	// Create tables if they don't exist
	db.exec(`
		CREATE TABLE IF NOT EXISTS config (
			id INTEGER PRIMARY KEY,
			key TEXT UNIQUE,
			value TEXT
		);
	`);
}

export default db;
