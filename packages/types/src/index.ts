// Base sync metadata for offline-first architecture
export type SyncStatus = 'synced' | 'pending_push' | 'conflict';

export interface BaseEntity {
  id: string; // UUID v4 (generated on client or server without collision)
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  deletedAt?: string | null; // Soft delete timestamp for sync propagation
  version: number; // Monotonic revision number for conflict resolution / CRDT / LWW
}

// User & Role Management
export type UserRole = 'owner' | 'manager' | 'receptionist' | 'housekeeper' | 'waiter' | 'kitchen';

export interface User extends BaseEntity {
  hotelId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  pinCode?: string; // 4-6 digit PIN for fast terminal switching
  isActive: boolean;
}

// Property & Hotel Details
export interface Hotel extends BaseEntity {
  name: string;
  code: string;
  currency: string;
  timeZone: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  settings?: Record<string, unknown>;
}

// Room & Category
export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance' | 'reserved';

export interface RoomType extends BaseEntity {
  hotelId: string;
  name: string;
  description?: string;
  basePrice: number;
  capacityAdults: number;
  capacityChildren: number;
  amenities: string[];
}

export interface Room extends BaseEntity {
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor?: string;
  building?: string;
  status: RoomStatus;
  currentReservationId?: string | null;
}

// Guest
export interface Guest extends BaseEntity {
  hotelId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  idType?: 'passport' | 'national_id' | 'driver_license';
  nationality?: string;
  notes?: string;
}

// Reservation & Booking
export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface Reservation extends BaseEntity {
  hotelId: string;
  guestId: string;
  roomId?: string | null;
  roomTypeId: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  adults: number;
  children: number;
  totalAmount: number;
  paidAmount: number;
  source: 'direct' | 'ota_booking' | 'ota_airbnb' | 'ota_expedia' | 'phone' | 'walk_in';
  notes?: string;
}

// Folio / Billing / Payments
export interface Payment extends BaseEntity {
  hotelId: string;
  reservationId?: string | null;
  amount: number;
  currency: string;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
  reference?: string;
  processedByUserId: string;
}

// Housekeeping Tasks
export type CleaningPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface HousekeepingTask extends BaseEntity {
  hotelId: string;
  roomId: string;
  assignedToUserId?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'inspected';
  priority: CleaningPriority;
  notes?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

// POS & Restaurant
export interface RestaurantCategory extends BaseEntity {
  hotelId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem extends BaseEntity {
  hotelId: string;
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface RestaurantOrder extends BaseEntity {
  hotelId: string;
  tableNumber?: string;
  roomId?: string; // Charge to room folio
  reservationId?: string;
  status: 'open' | 'preparing' | 'served' | 'paid' | 'cancelled';
  totalAmount: number;
  items: RestaurantOrderItem[];
}

export interface RestaurantOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

// Sync Log / Mutation Protocol
export interface SyncChangeRecord {
  id: string;
  table: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  timestamp: string;
  nodeId: string; // ID of the machine/terminal that made the change
  syncedToCloud: boolean;
}
