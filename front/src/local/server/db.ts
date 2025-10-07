// src/lib/server/db.ts
import Database from 'better-sqlite3';

const db = new Database('data.sqlite', { verbose: console.log });

// Optional: create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE,
    value TEXT
  );
`);

export default db;
