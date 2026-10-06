import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper for UUID primary keys and standard audit + sync columns
const baseColumns = {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text('deleted_at'),
  version: integer('version').notNull().default(1),
};

// 1. Hotels / Properties
export const hotels = sqliteTable('hotels', {
  ...baseColumns,
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  currency: text('currency').notNull().default('USD'),
  timeZone: text('time_zone').notNull().default('UTC'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  taxNumber: text('tax_number'),
  settingsJson: text('settings_json'), // JSON blob for flexible config
});

// 2. Users & Staff
export const users = sqliteTable('users', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  pinCode: text('pin_code'), // Fast PIN switch for POS / reception terminals
  role: text('role', { enum: ['owner', 'manager', 'receptionist', 'housekeeper', 'waiter', 'kitchen'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// 3. Room Types
export const roomTypes = sqliteTable('room_types', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: real('base_price').notNull().default(0),
  capacityAdults: integer('capacity_adults').notNull().default(2),
  capacityChildren: integer('capacity_children').notNull().default(0),
  amenitiesJson: text('amenities_json'), // JSON array of amenities
});

// 4. Rooms
export const rooms = sqliteTable('rooms', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  roomTypeId: text('room_type_id').notNull().references(() => roomTypes.id),
  roomNumber: text('room_number').notNull(),
  floor: text('floor'),
  building: text('building'),
  status: text('status', { enum: ['available', 'occupied', 'dirty', 'cleaning', 'maintenance', 'reserved'] })
    .notNull()
    .default('available'),
  currentReservationId: text('current_reservation_id'),
});

// 5. Guests
export const guests = sqliteTable('guests', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  idNumber: text('id_number'),
  idType: text('id_type'),
  nationality: text('nationality'),
  notes: text('notes'),
});

// 6. Reservations
export const reservations = sqliteTable('reservations', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  guestId: text('guest_id').notNull().references(() => guests.id),
  roomId: text('room_id').references(() => rooms.id),
  roomTypeId: text('room_type_id').notNull().references(() => roomTypes.id),
  checkInDate: text('check_in_date').notNull(), // ISO YYYY-MM-DD
  checkOutDate: text('check_out_date').notNull(), // ISO YYYY-MM-DD
  actualCheckIn: text('actual_check_in'),
  actualCheckOut: text('actual_check_out'),
  status: text('status', { enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'] })
    .notNull()
    .default('confirmed'),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'partially_paid', 'paid', 'refunded'] })
    .notNull()
    .default('unpaid'),
  adults: integer('adults').notNull().default(1),
  children: integer('children').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  paidAmount: real('paid_amount').notNull().default(0),
  source: text('source').notNull().default('direct'),
  notes: text('notes'),
});

// 7. Payments / Folios
export const payments = sqliteTable('payments', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  reservationId: text('reservation_id').references(() => reservations.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  method: text('method', { enum: ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'] }).notNull(),
  reference: text('reference'),
  processedByUserId: text('processed_by_user_id').references(() => users.id),
});

// 8. Housekeeping Tasks
export const housekeepingTasks = sqliteTable('housekeeping_tasks', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  roomId: text('room_id').notNull().references(() => rooms.id),
  assignedToUserId: text('assigned_to_user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'inspected'] })
    .notNull()
    .default('pending'),
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] })
    .notNull()
    .default('normal'),
  notes: text('notes'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});

// 9. Restaurant / POS
export const menuCategories = sqliteTable('menu_categories', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const menuItems = sqliteTable('menu_items', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  categoryId: text('category_id').notNull().references(() => menuCategories.id),
  name: text('name').notNull(),
  price: real('price').notNull().default(0),
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),
});

export const restaurantOrders = sqliteTable('restaurant_orders', {
  ...baseColumns,
  hotelId: text('hotel_id').notNull().references(() => hotels.id),
  tableNumber: text('table_number'),
  roomId: text('room_id').references(() => rooms.id),
  reservationId: text('reservation_id').references(() => reservations.id),
  status: text('status', { enum: ['open', 'preparing', 'served', 'paid', 'cancelled'] })
    .notNull()
    .default('open'),
  totalAmount: real('total_amount').notNull().default(0),
});

export const restaurantOrderItems = sqliteTable('restaurant_order_items', {
  ...baseColumns,
  orderId: text('order_id').notNull().references(() => restaurantOrders.id),
  menuItemId: text('menu_item_id').notNull().references(() => menuItems.id),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull().default(0),
  notes: text('notes'),
});

// 10. Offline Sync Journal / Mutation Queue
// Tracks every mutation created locally to replay to cloud when online or sync with peer terminals
export const syncJournal = sqliteTable('sync_journal', {
  id: text('id').primaryKey(),
  hotelId: text('hotel_id').notNull(),
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  operation: text('operation', { enum: ['INSERT', 'UPDATE', 'DELETE'] }).notNull(),
  payloadJson: text('payload_json').notNull(), // Exact row state / patch
  nodeId: text('node_id').notNull(), // Terminal ID / Server ID
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  syncedToCloud: integer('synced_to_cloud', { mode: 'boolean' }).notNull().default(false),
  syncedAt: text('synced_at'),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
});
