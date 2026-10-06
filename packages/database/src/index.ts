import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export * from './schema.js';

export function createDatabaseClient(dbPath: string = 'hospware.db') {
  const sqlite = new Database(dbPath);
  // Enable WAL mode for high concurrency in local SQLite
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type HospwareDatabase = ReturnType<typeof createDatabaseClient>;
