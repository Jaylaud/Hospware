import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  LicenseSigner, 
  LicenseValidator, 
  AntiTamperClock, 
  LicensePayload,
  StoredClockRecord 
} from '../index';

describe('Ed25519 Cryptographic Licensing', () => {
  const keyPair = LicenseSigner.generateKeyPair();
  const tenantId = 'tenant-test-123';
  const propertyId = 'prop-test-456';

  const validPayload: LicensePayload = {
    tenantId,
    propertyId,
    hotelName: 'Serene Palms Hotel',
    tier: 'STANDARD',
    maxRooms: 40,
    maxDeviceSeats: 8,
    enabledFeatures: ['POS', 'GUEST_PORTAL'],
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ahead
    gracePeriodDays: 5,
  };

  it('generates a signed license token that verifies offline', () => {
    const token = LicenseSigner.signLicense(validPayload, keyPair.privateKeyPem);
    assert.ok(typeof token === 'string' && token.includes('.'));

    const result = LicenseValidator.validateLicense({
      licenseToken: token,
      publicKeyPem: keyPair.publicKeyPem,
      expectedTenantId: tenantId,
      expectedPropertyId: propertyId,
      lastClockRecord: null,
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.status, 'ACTIVE');
    assert.ok(result.daysRemaining > 0);
  });

  it('rejects tampered license payloads', () => {
    const token = LicenseSigner.signLicense(validPayload, keyPair.privateKeyPem);
    const [header, sig] = token.split('.');
    
    // Modify payload base64
    const corruptToken = `eyJ0ZW5hbnRJZCI6ImZha2UifQ.${sig}`;

    const result = LicenseValidator.validateLicense({
      licenseToken: corruptToken,
      publicKeyPem: keyPair.publicKeyPem,
      expectedTenantId: tenantId,
      expectedPropertyId: propertyId,
      lastClockRecord: null,
    });

    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.status, 'INVALID_SIGNATURE');
  });

  it('detects backward clock rollback (anti-tamper)', () => {
    const lastRecord: StoredClockRecord = {
      lastKnownTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day in the future
      sequenceHash: 'hash-abc',
      transactionCount: 50,
    };

    const clockCheck = AntiTamperClock.verifySystemClock(lastRecord, new Date());
    assert.strictEqual(clockCheck.isTampered, true);
    assert.ok(clockCheck.reason?.includes('rolled back'));
  });
});
