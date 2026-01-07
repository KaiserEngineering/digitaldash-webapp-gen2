// src/lib/server/db.ts
import Database from 'better-sqlite3';
import { isVercelDeployment } from '$lib/config';

let db: Database.Database | null = null;

// Only initialize SQLite when NOT on Vercel (serverless doesn't support it)
if (!isVercelDeployment) {
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
