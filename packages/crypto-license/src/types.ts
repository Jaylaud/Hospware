export interface LicensePayload {
  tenantId: string;
  propertyId: string;
  hotelName: string;
  tier: 'LITE' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  maxRooms: number;
  maxDeviceSeats: number;
  enabledFeatures: string[]; // e.g. ['POS', 'GUEST_PORTAL', 'WHATSAPP_ALERTS', 'MULTI_CURRENCY']
  issuedAt: string; // ISO-8601
  expiresAt: string; // ISO-8601
  gracePeriodDays: number; // e.g. 5 days
}

export type LicenseStatus =
  | 'ACTIVE'
  | 'IN_GRACE_PERIOD'
  | 'EXPIRED'
  | 'INVALID_SIGNATURE'
  | 'CLOCK_TAMPER_DETECTED'
  | 'TENANT_MISMATCH';

export interface LicenseValidationResult {
  isValid: boolean;
  status: LicenseStatus;
  payload?: LicensePayload;
  daysRemaining: number;
  message: string;
}

export interface StoredClockRecord {
  lastKnownTimestamp: string; // ISO-8601
  sequenceHash: string;
  transactionCount: number;
}
