import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export * from './schema.js';
export { eq, desc, asc, and, or, sql } from 'drizzle-orm';

export function initTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hotels (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      currency TEXT NOT NULL DEFAULT 'USD',
      time_zone TEXT NOT NULL DEFAULT 'UTC',
      address TEXT,
      phone TEXT,
      email TEXT,
      tax_number TEXT,
      license_key TEXT,
      cloud_tenant_id TEXT,
      subscription_status TEXT DEFAULT 'trialing',
      subscription_tier TEXT DEFAULT 'starter',
      max_rooms INTEGER DEFAULT 30,
      settings_json TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      hotel_id TEXT NOT NULL REFERENCES hotels(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT,
      pin_code TEXT,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_pin INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_invitations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      hotel_id TEXT NOT NULL REFERENCES hotels(id),
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      invited_by_user_id TEXT REFERENCES users(id),
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS room_types (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      hotel_id TEXT NOT NULL REFERENCES hotels(id),
      name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL DEFAULT 0,
      capacity_adults INTEGER NOT NULL DEFAULT 2,
      capacity_children INTEGER NOT NULL DEFAULT 0,
      amenities_json TEXT
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      hotel_id TEXT NOT NULL REFERENCES hotels(id),
      room_type_id TEXT NOT NULL REFERENCES room_types(id),
      room_number TEXT NOT NULL,
      floor TEXT,
      building TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      current_reservation_id TEXT
    );

    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      hotel_id TEXT NOT NULL REFERENCES hotels(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      id_number TEXT,
      id_type TEXT,
      nationality TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_journal (
      id TEXT PRIMARY KEY,
      hotel_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      node_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      synced_to_cloud INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );
  `);
}

export function createDatabaseClient(dbPath: string = 'hospware.db') {
  const sqlite = new Database(dbPath);
  // Enable WAL mode for high concurrency in local SQLite
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  initTables(sqlite);
  return drizzle(sqlite, { schema });
}

export type HospwareDatabase = ReturnType<typeof createDatabaseClient>;
