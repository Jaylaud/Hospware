import { pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const cloudTenantsTable = pgTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudPropertiesTable = pgTable('properties', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => cloudTenantsTable.id),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('USD'),
  timezone: text('timezone').notNull().default('UTC'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  checkInTime: text('check_in_time').notNull().default('14:00'),
  checkOutTime: text('check_out_time').notNull().default('11:00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudUsersTable = pgTable('users', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  fullName: text('full_name').notNull(),
  username: text('username').notNull(),
  pinCode: text('pin_code').notNull(),
  role: text('role').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cloudRoomTypesTable = pgTable('room_types', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull().default(''),
  basePrice: doublePrecision('base_price').notNull(),
  maxAdults: integer('max_adults').notNull().default(2),
  maxChildren: integer('max_children').notNull().default(1),
  amenities: jsonb('amenities').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudRoomsTable = pgTable('rooms', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  roomTypeId: text('room_type_id').notNull().references(() => cloudRoomTypesTable.id),
  roomNumber: text('room_number').notNull(),
  floor: integer('floor').notNull().default(1),
  status: text('status').notNull().default('VACANT_DIRTY'),
  cleaningPriority: integer('cleaning_priority').notNull().default(3),
  currentReservationId: text('current_reservation_id'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudGuestsTable = pgTable('guests', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  idDocumentType: text('id_document_type'),
  idDocumentNumber: text('id_document_number'),
  vipStatus: boolean('vip_status').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudReservationsTable = pgTable('reservations', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  guestId: text('guest_id').notNull().references(() => cloudGuestsTable.id),
  roomId: text('room_id').references(() => cloudRoomsTable.id),
  roomTypeId: text('room_type_id').notNull().references(() => cloudRoomTypesTable.id),
  status: text('status').notNull().default('CONFIRMED'),
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date').notNull(),
  adultsCount: integer('adults_count').notNull().default(1),
  childrenCount: integer('children_count').notNull().default(0),
  nightlyRate: doublePrecision('nightly_rate').notNull(),
  totalEstimatedAmount: doublePrecision('total_estimated_amount').notNull(),
  depositPaid: doublePrecision('deposit_paid').notNull().default(0),
  source: text('source').notNull().default('WALK_IN'),
  sourceReference: text('source_reference'),
  notes: text('notes'),
  checkedInAt: timestamp('checked_in_at'),
  checkedOutAt: timestamp('checked_out_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudFoliosTable = pgTable('folios', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull().references(() => cloudPropertiesTable.id),
  reservationId: text('reservation_id').notNull().references(() => cloudReservationsTable.id),
  guestId: text('guest_id').notNull().references(() => cloudGuestsTable.id),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('OPEN'),
  totalCharges: doublePrecision('total_charges').notNull().default(0),
  totalTaxes: doublePrecision('total_taxes').notNull().default(0),
  totalPayments: doublePrecision('total_payments').notNull().default(0),
  totalDiscounts: doublePrecision('total_discounts').notNull().default(0),
  balanceDue: doublePrecision('balance_due').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cloudFolioItemsTable = pgTable('folio_items', {
  id: text('id').primaryKey(),
  folioId: text('folio_id').notNull().references(() => cloudFoliosTable.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: doublePrecision('unit_price').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  taxAmount: doublePrecision('tax_amount').notNull().default(0),
  paymentMethod: text('payment_method'),
  paymentReference: text('payment_reference'),
  createdByUserId: text('created_by_user_id').notNull(),
  isVoided: boolean('is_voided').notNull().default(false),
  voidReason: text('void_reason'),
  voidedByUserId: text('voided_by_user_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cloudSyncInboxTable = pgTable('sync_inbox', {
  id: text('id').primaryKey(),
  propertyId: text('property_id').notNull(),
  batchId: text('batch_id').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});
