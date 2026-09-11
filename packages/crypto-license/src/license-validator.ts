import crypto from 'node:crypto';
import { AntiTamperClock } from './anti-tamper-clock';
import { LicensePayload, LicenseValidationResult, StoredClockRecord } from './types';

export class LicenseValidator {
  /**
   * Validates a license token offline using the embedded public key and monotonic clock check.
   */
  public static validateLicense(params: {
    licenseToken: string;
    publicKeyPem: string;
    expectedTenantId: string;
    expectedPropertyId: string;
    lastClockRecord: StoredClockRecord | null;
    currentTime?: Date;
  }): LicenseValidationResult {
    const {
      licenseToken,
      publicKeyPem,
      expectedTenantId,
      expectedPropertyId,
      lastClockRecord,
      currentTime = new Date(),
    } = params;

    // 1. Monotonic Clock Anti-Tamper Check
    const clockCheck = AntiTamperClock.verifySystemClock(lastClockRecord, currentTime);
    if (clockCheck.isTampered) {
      return {
        isValid: false,
        status: 'CLOCK_TAMPER_DETECTED',
        daysRemaining: 0,
        message: `Security Lock: ${clockCheck.reason}`,
      };
    }

    // 2. Token Format Check
    const parts = licenseToken.trim().split('.');
    if (parts.length !== 2) {
      return {
        isValid: false,
        status: 'INVALID_SIGNATURE',
        daysRemaining: 0,
        message: 'Invalid license key structure.',
      };
    }

    const [payloadBase64, signatureBase64] = parts;

    // 3. Cryptographic Signature Verification
    try {
      const isVerified = crypto.verify(
        null,
        Buffer.from(payloadBase64, 'utf-8'),
        publicKeyPem,
        Buffer.from(signatureBase64, 'base64url')
      );

      if (!isVerified) {
        return {
          isValid: false,
          status: 'INVALID_SIGNATURE',
          daysRemaining: 0,
          message: 'License cryptographic signature verification failed.',
        };
      }
    } catch (err: any) {
      return {
        isValid: false,
        status: 'INVALID_SIGNATURE',
        daysRemaining: 0,
        message: `Signature error: ${err.message}`,
      };
    }

    // 4. Parse Payload
    let payload: LicensePayload;
    try {
      const decodedJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
      payload = JSON.parse(decodedJson);
    } catch {
      return {
        isValid: false,
        status: 'INVALID_SIGNATURE',
        daysRemaining: 0,
        message: 'Corrupt license payload.',
      };
    }

    // 5. Tenant & Property Match
    if (payload.tenantId !== expectedTenantId || payload.propertyId !== expectedPropertyId) {
      return {
        isValid: false,
        status: 'TENANT_MISMATCH',
        payload,
        daysRemaining: 0,
        message: 'License was issued for a different hotel property.',
      };
    }

    // 6. Expiry & Grace Period Check
    const expiresAtMs = new Date(payload.expiresAt).getTime();
    const currentMs = currentTime.getTime();
    const diffMs = expiresAtMs - currentMs;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs >= 0) {
      return {
        isValid: true,
        status: 'ACTIVE',
        payload,
        daysRemaining,
        message: `License is active. (${daysRemaining} days remaining)`,
      };
    }

    // Check Grace Period
    const gracePeriodMs = (payload.gracePeriodDays || 5) * 24 * 60 * 60 * 1000;
    const graceElapsedMs = currentMs - expiresAtMs;

    if (graceElapsedMs <= gracePeriodMs) {
      const graceDaysLeft = Math.ceil((gracePeriodMs - graceElapsedMs) / (1000 * 60 * 60 * 24));
      return {
        isValid: true,
        status: 'IN_GRACE_PERIOD',
        payload,
        daysRemaining: -graceDaysLeft,
        message: `License expired! In offline grace period (${graceDaysLeft} days left before lock).`,
      };
    }

    return {
      isValid: false,
      status: 'EXPIRED',
      payload,
      daysRemaining: 0,
      message: 'License has expired and grace period has ended. Please renew subscription.',
    };
  }
}
