/**
 * Core Domain Enums & Interfaces for Hospware PMS
 */

export enum UserRole {
  OWNER = 'OWNER',
  GENERAL_MANAGER = 'GENERAL_MANAGER',
  FRONT_DESK = 'FRONT_DESK',
  HOUSEKEEPING_SUPERVISOR = 'HOUSEKEEPING_SUPERVISOR',
  HOUSEKEEPER = 'HOUSEKEEPER',
  BAR_RESTAURANT_STAFF = 'BAR_RESTAURANT_STAFF',
  MAINTENANCE = 'MAINTENANCE',
}

export enum RoomStatus {
  VACANT_CLEAN = 'VACANT_CLEAN',
  VACANT_DIRTY = 'VACANT_DIRTY',
  CLEANING_IN_PROGRESS = 'CLEANING_IN_PROGRESS',
  INSPECTED = 'INSPECTED',
  OCCUPIED_CLEAN = 'OCCUPIED_CLEAN',
  OCCUPIED_DIRTY = 'OCCUPIED_DIRTY',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE', // Minor repair, can be reactivated fast
  OUT_OF_ORDER = 'OUT_OF_ORDER',     // Taken off market, excluded from room count for RevPAR
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentMethod {
  CASH = 'CASH',
  PAYSTACK_MOMO = 'PAYSTACK_MOMO',
  PAYSTACK_CARD = 'PAYSTACK_CARD',
  CARD_TERMINAL = 'CARD_TERMINAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CITY_LEDGER = 'CITY_LEDGER', // Corporate invoice
  COMPLIMENTARY = 'COMPLIMENTARY',
}

export enum FolioItemType {
  ROOM_CHARGE = 'ROOM_CHARGE',
  POS_RESTAURANT = 'POS_RESTAURANT',
  POS_BAR = 'POS_BAR',
  LAUNDRY = 'LAUNDRY',
  MINIBAR = 'MINIBAR',
  LATE_CHECKOUT = 'LATE_CHECKOUT',
  EARLY_CHECKIN = 'EARLY_CHECKIN',
  DAMAGE_FEE = 'DAMAGE_FEE',
  CUSTOM_CHARGE = 'CUSTOM_CHARGE',
  TAX_VAT = 'TAX_VAT',
  TAX_TOURISM = 'TAX_TOURISM',
  SERVICE_CHARGE = 'SERVICE_CHARGE',
  DISCOUNT = 'DISCOUNT',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export interface TaxRule {
  id: string;
  name: string;
  code: 'VAT' | 'TOURISM' | 'SERVICE' | 'OTHER';
  ratePercentage: number; // e.g., 15 for 15%
  isCompounded: boolean;
  appliesTo: ('ROOM' | 'POS' | 'ALL')[];
  enabled: boolean;
}

export interface FolioItem {
  id: string;
  folioId: string;
  type: FolioItemType;
  description: string;
  quantity: number;
  unitPrice: number; // in lowest currency unit (cents / pesewas / kobo) or decimal
  totalAmount: number; // positive for charges, negative for payments/discounts
  taxAmount: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  createdByUserId: string;
  isVoided: boolean;
  voidReason?: string;
  voidedByUserId?: string;
  createdAt: string; // ISO-8601
}

export interface Folio {
  id: string;
  reservationId: string;
  propertyId: string;
  guestId: string;
  currency: string;
  status: 'OPEN' | 'CLOSED' | 'TRANSFERRED';
  items: FolioItem[];
  totalCharges: number;
  totalTaxes: number;
  totalPayments: number;
  totalDiscounts: number;
  balanceDue: number; // charges + taxes - discounts - payments
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  status: RoomStatus;
  currentReservationId?: string;
  cleaningPriority: number; // 1 (highest/checkout pending) to 5
  notes?: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  description: string;
  basePrice: number;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  totalUnits: number;
}

export interface Reservation {
  id: string;
  propertyId: string;
  guestId: string;
  roomId?: string;
  roomTypeId: string;
  status: ReservationStatus;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adultsCount: number;
  childrenCount: number;
  nightlyRate: number;
  totalEstimatedAmount: number;
  depositPaid: number;
  source: 'WALK_IN' | 'PHONE' | 'GUEST_PORTAL' | 'OTA' | 'CORPORATE';
  sourceReference?: string;
  notes?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  propertyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idDocumentType?: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'VOTER_ID';
  idDocumentNumber?: string;
  vipStatus: boolean;
  notes?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  propertyId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingCashFloat: number;
  expectedClosingCash: number;
  actualBlindDropCash?: number;
  cashVariance?: number; // actual - expected
  varianceReason?: string;
  status: 'OPEN' | 'CLOSED';
  auditFlagged: boolean;
}

export interface CashTransaction {
  id: string;
  shiftId: string;
  propertyId: string;
  type: 'PAYMENT_RECEIVED' | 'PAYOUT_EXPENSE' | 'FLOAT_ADJUSTMENT' | 'REFUND';
  amount: number;
  description: string;
  relatedFolioId?: string;
  authorizedByUserId: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  propertyId: string;
  userId: string;
  action: 'ROOM_STATUS_OVERRIDE' | 'RATE_OVERRIDE' | 'FOLIO_ITEM_VOID' | 'MANUAL_DISCOUNT' | 'SHIFT_VARIANCE' | 'KEY_TAMPER_SUSPECT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata: Record<string, any>;
  createdAt: string;
}
