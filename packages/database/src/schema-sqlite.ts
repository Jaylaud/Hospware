import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tenantsTable = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const propertiesTable = sqliteTable('properties', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenantsTable.id),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('USD'),
  timezone: text('timezone').notNull().default('UTC'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  checkInTime: text('check_in_time').notNull().default('14:00'),
  checkOutTime: text('check_out_time').notNull().default('11:00'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  pinCode: text('pin_code').notNull(), // Hashed 4-6 digit PIN for fast terminal switch
  role: text('role').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const roomTypesTable = sqliteTable('room_types', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  basePrice: real('base_price').notNull(),
  maxAdults: integer('max_adults').notNull().default(2),
  maxChildren: integer('max_children').notNull().default(1),
  amenitiesJson: text('amenities_json').notNull().default('[]'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const roomsTable = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  roomTypeId: text('room_type_id').notNull().references(() => roomTypesTable.id),
  roomNumber: text('room_number').notNull(),
  floor: integer('floor').notNull().default(1),
  status: text('status').notNull().default('VACANT_DIRTY'),
  cleaningPriority: integer('cleaning_priority').notNull().default(3),
  currentReservationId: text('current_reservation_id'),
  notes: text('notes'),
  updatedAt: text('updated_at').notNull(),
});

export const guestsTable = sqliteTable('guests', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  idDocumentType: text('id_document_type'),
  idDocumentNumber: text('id_document_number'),
  vipStatus: integer('vip_status', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reservationsTable = sqliteTable('reservations', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  guestId: text('guest_id').notNull().references(() => guestsTable.id),
  roomId: text('room_id').references(() => roomsTable.id),
  roomTypeId: text('room_type_id').notNull().references(() => roomTypesTable.id),
  status: text('status').notNull().default('CONFIRMED'),
  checkInDate: text('check_in_date').notNull(), // YYYY-MM-DD
  checkOutDate: text('check_out_date').notNull(), // YYYY-MM-DD
  adultsCount: integer('adults_count').notNull().default(1),
  childrenCount: integer('children_count').notNull().default(0),
  nightlyRate: real('nightly_rate').notNull(),
  totalEstimatedAmount: real('total_estimated_amount').notNull(),
  depositPaid: real('deposit_paid').notNull().default(0),
  source: text('source').notNull().default('WALK_IN'),
  sourceReference: text('source_reference'),
  notes: text('notes'),
  checkedInAt: text('checked_in_at'),
  checkedOutAt: text('checked_out_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const foliosTable = sqliteTable('folios', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  reservationId: text('reservation_id').notNull().references(() => reservationsTable.id),
  guestId: text('guest_id').notNull().references(() => guestsTable.id),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('OPEN'),
  totalCharges: real('total_charges').notNull().default(0),
  totalTaxes: real('total_taxes').notNull().default(0),
  totalPayments: real('total_payments').notNull().default(0),
  totalDiscounts: real('total_discounts').notNull().default(0),
  balanceDue: real('balance_due').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const folioItemsTable = sqliteTable('folio_items', {
  id: text('id').primaryKey(),
  folioId: text('folio_id').notNull().references(() => foliosTable.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  totalAmount: real('total_amount').notNull(),
  taxAmount: real('tax_amount').notNull().default(0),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  createdByUserId: text('created_by_user_id').notNull(),
  isVoided: integer('is_voided', { mode: 'boolean' }).notNull().default(false),
  voidReason: text('void_reason'),
  voidedByUserId: text('voided_by_user_id'),
  createdAt: text('created_at').notNull(),
});

export const shiftsTable = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  userId: text('user_id').notNull().references(() => usersTable.id),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
  openingCashFloat: real('opening_cash_float').notNull(),
  expectedClosingCash: real('expected_closing_cash').notNull().default(0),
  actualBlindDropCash: real('actual_blind_drop_cash'),
  cashVariance: real('cash_variance'),
  varianceReason: text('variance_reason'),
  status: text('status').notNull().default('OPEN'),
  auditFlagged: integer('audit_flagged', { mode: 'boolean' }).notNull().default(false),
});

export const cashTransactionsTable = sqliteTable('cash_transactions', {
  id: text('id').primaryKey(),
  shiftId: text('shift_id').notNull().references(() => shiftsTable.id),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  relatedFolioId: text('related_folio_id'),
  authorizedByUserId: text('authorized_by_user_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const auditLogsTable = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => propertiesTable.id),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  severity: text('severity').notNull().default('INFO'),
  metadataJson: text('metadata_json').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
});

export const syncOutboxTable = sqliteTable('sync_outbox', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(), // 'INSERT' | 'UPDATE' | 'DELETE'
  payloadJson: text('payload_json').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
  syncedAt: text('synced_at'),
  createdAt: text('created_at').notNull(),
});

export const licenseRecordsTable = sqliteTable('license_records', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  licenseToken: text('license_token').notNull(),
  cachedPayloadJson: text('cached_payload_json').notNull(),
  lastVerifiedAt: text('last_verified_at').notNull(),
  sequenceHash: text('sequence_hash').notNull(),
  transactionCount: integer('transaction_count').notNull().default(0),
});
