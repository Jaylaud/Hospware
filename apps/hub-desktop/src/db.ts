import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from '@hospware/database';
import { RoomStatus, UserRole } from '@hospware/core-domain';

export function initLocalDatabase(dbPath?: string) {
  const finalPath = dbPath || path.resolve(process.cwd(), 'hospware-local.db');
  const dbDir = path.dirname(finalPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqlite = new Database(finalPath);

  // Enable WAL mode for high concurrency
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');

  // Create tables if not exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id),
      name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      address TEXT,
      phone TEXT,
      email TEXT,
      check_in_time TEXT NOT NULL DEFAULT '14:00',
      check_out_time TEXT NOT NULL DEFAULT '11:00',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      pin_code TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_types (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      base_price REAL NOT NULL,
      max_adults INTEGER NOT NULL DEFAULT 2,
      max_children INTEGER NOT NULL DEFAULT 1,
      amenities_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      room_type_id TEXT NOT NULL REFERENCES room_types(id),
      room_number TEXT NOT NULL,
      floor INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'VACANT_DIRTY',
      cleaning_priority INTEGER NOT NULL DEFAULT 3,
      current_reservation_id TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      id_document_type TEXT,
      id_document_number TEXT,
      vip_status INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      guest_id TEXT NOT NULL REFERENCES guests(id),
      room_id TEXT REFERENCES rooms(id),
      room_type_id TEXT NOT NULL REFERENCES room_types(id),
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      adults_count INTEGER NOT NULL DEFAULT 1,
      children_count INTEGER NOT NULL DEFAULT 0,
      nightly_rate REAL NOT NULL,
      total_estimated_amount REAL NOT NULL,
      deposit_paid REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'WALK_IN',
      source_reference TEXT,
      notes TEXT,
      checked_in_at TEXT,
      checked_out_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folios (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      reservation_id TEXT NOT NULL REFERENCES reservations(id),
      guest_id TEXT NOT NULL REFERENCES guests(id),
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'OPEN',
      total_charges REAL NOT NULL DEFAULT 0,
      total_taxes REAL NOT NULL DEFAULT 0,
      total_payments REAL NOT NULL DEFAULT 0,
      total_discounts REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folio_items (
      id TEXT PRIMARY KEY,
      folio_id TEXT NOT NULL REFERENCES folios(id),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      payment_reference TEXT,
      created_by_user_id TEXT NOT NULL,
      is_voided INTEGER NOT NULL DEFAULT 0,
      void_reason TEXT,
      voided_by_user_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_cash_float REAL NOT NULL,
      expected_closing_cash REAL NOT NULL DEFAULT 0,
      actual_blind_drop_cash REAL,
      cash_variance REAL,
      variance_reason TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      audit_flagged INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cash_transactions (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL REFERENCES shifts(id),
      property_id TEXT NOT NULL REFERENCES properties(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      related_folio_id TEXT,
      authorized_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id),
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      sequence_number INTEGER NOT NULL,
      is_synced INTEGER NOT NULL DEFAULT 0,
      synced_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS license_records (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      license_token TEXT NOT NULL,
      cached_payload_json TEXT NOT NULL,
      last_verified_at TEXT NOT NULL,
      sequence_hash TEXT NOT NULL,
      transaction_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed default data if empty
  seedDefaultDataIfEmpty(sqlite);

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

function seedDefaultDataIfEmpty(sqlite: Database.Database) {
  const rowCount = sqlite.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (rowCount.count > 0) return;

  const now = new Date().toISOString();
  const tenantId = 'tenant-demo-001';
  const propertyId = 'prop-demo-001';

  sqlite.prepare(`
    INSERT INTO tenants (id, name, slug, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(tenantId, 'Grand Horizon Hospitality', 'grand-horizon', now, now);

  sqlite.prepare(`
    INSERT INTO properties (id, tenant_id, name, currency, timezone, address, phone, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    propertyId,
    tenantId,
    'Grand Horizon Hotel & Suites',
    'USD',
    'UTC',
    '104 Independence Ave, Accra, Ghana',
    '+233 24 000 1122',
    'frontdesk@grandhorizon.com',
    now,
    now
  );

  // Users: Manager, Front Desk, Housekeeper
  sqlite.prepare(`
    INSERT INTO users (id, property_id, full_name, username, pin_code, role, active, created_at)
    VALUES 
      ('usr-1', ?, 'Alice Johnson (GM)', 'admin', '1234', 'OWNER', 1, ?),
      ('usr-2', ?, 'Kwame Mensah (Front Desk)', 'reception', '2222', 'FRONT_DESK', 1, ?),
      ('usr-3', ?, 'Abena Osei (Housekeeping)', 'housekeeping', '3333', 'HOUSEKEEPER', 1, ?),
      ('usr-4', ?, 'Kofi Boateng (Bar/POS)', 'bar', '4444', 'BAR_RESTAURANT_STAFF', 1, ?)
  `).run(propertyId, now, propertyId, now, propertyId, now, propertyId, now);

  // Room Types
  sqlite.prepare(`
    INSERT INTO room_types (id, property_id, name, code, description, base_price, max_adults, max_children, amenities_json, created_at, updated_at)
    VALUES
      ('rt-std', ?, 'Standard Queen Room', 'STD', 'Cozy queen bed with AC and hot shower', 65.0, 2, 1, '["WiFi", "AC", "TV", "Hot Shower"]', ?, ?),
      ('rt-dlx', ?, 'Deluxe King Suite', 'DLX', 'Spacious king suite with balcony and minibar', 110.0, 2, 2, '["WiFi", "AC", "King Bed", "Minibar", "Balcony", "Breakfast"]', ?, ?),
      ('rt-exc', ?, 'Executive Penthouse', 'EXC', 'Luxury penthouse with private lounge access', 220.0, 4, 2, '["WiFi", "AC", "Ocean View", "Jacuzzi", "Kitchenette", "VIP Lounge"]', ?, ?)
  `).run(propertyId, now, now, propertyId, now, now, propertyId, now, now);

  // Rooms (Floors 1 & 2)
  const roomInserts = [
    { id: 'rm-101', num: '101', floor: 1, typeId: 'rt-std', status: RoomStatus.VACANT_CLEAN },
    { id: 'rm-102', num: '102', floor: 1, typeId: 'rt-std', status: RoomStatus.VACANT_DIRTY },
    { id: 'rm-103', num: '103', floor: 1, typeId: 'rt-dlx', status: RoomStatus.VACANT_CLEAN },
    { id: 'rm-104', num: '104', floor: 1, typeId: 'rt-dlx', status: RoomStatus.CLEANING_IN_PROGRESS },
    { id: 'rm-201', num: '201', floor: 2, typeId: 'rt-std', status: RoomStatus.OCCUPIED_CLEAN },
    { id: 'rm-202', num: '202', floor: 2, typeId: 'rt-dlx', status: RoomStatus.VACANT_CLEAN },
    { id: 'rm-203', num: '203', floor: 2, typeId: 'rt-dlx', status: RoomStatus.OCCUPIED_DIRTY },
    { id: 'rm-204', num: '204', floor: 2, typeId: 'rt-exc', status: RoomStatus.INSPECTED },
  ];

  const stmt = sqlite.prepare(`
    INSERT INTO rooms (id, property_id, room_type_id, room_number, floor, status, cleaning_priority, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 3, ?)
  `);

  for (const r of roomInserts) {
    stmt.run(r.id, propertyId, r.typeId, r.num, r.floor, r.status, now);
  }
}
