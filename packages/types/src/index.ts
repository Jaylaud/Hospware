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
  mustChangePin?: boolean;
}

// User Invitations
export type UserInvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface UserInvitation extends BaseEntity {
  hotelId: string;
  email: string;
  role: UserRole;
  token: string;
  invitedByUserId?: string;
  expiresAt: string;
  acceptedAt?: string | null;
  status: UserInvitationStatus;
}

// Property & Hotel Details
export type HotelSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type HotelSubscriptionTier = 'starter' | 'standard' | 'premium';

export interface Hotel extends BaseEntity {
  name: string;
  code: string;
  currency: string;
  timeZone: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  licenseKey?: string;
  cloudTenantId?: string;
  subscriptionStatus?: HotelSubscriptionStatus;
  subscriptionTier?: HotelSubscriptionTier;
  maxRooms?: number;
  activeModules?: string[];
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

// Receipt & Invoicing
export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt extends BaseEntity {
  hotelId: string;
  paymentId: string;
  reservationId?: string | null;
  receiptNumber: string;
  guestName: string;
  roomNumber?: string;
  lineItems: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
  issuedAt: string;
}

// Owner Subscription Invoices & Billing
export interface SubscriptionInvoice extends BaseEntity {
  hotelId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planTier: HotelSubscriptionTier;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  pdfUrl?: string;
}

// Realtime Activity & Notifications (Owner alert stream)
export type ActivityEventType = 'check_in' | 'check_out' | 'payment' | 'cleaning_done' | 'room_issue' | 'alert';

export interface ActivityNotification extends BaseEntity {
  hotelId: string;
  actorName: string;
  eventType: ActivityEventType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
}

