import { LicenseSigner, LicensePayload } from '@hospware/crypto-license';

export class CloudLicenseService {
  private static keyPair = LicenseSigner.generateKeyPair();

  public static getPublicKeyPem(): string {
    return this.keyPair.publicKeyPem;
  }

  public static issueLicense(params: {
    tenantId: string;
    propertyId: string;
    hotelName: string;
    tier: 'LITE' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
    maxRooms: number;
    maxDeviceSeats: number;
    enabledFeatures: string[];
    validDays: number;
  }): { licenseToken: string; payload: LicensePayload; publicKeyPem: string } {
    const now = new Date();
    const expiry = new Date(now.getTime() + params.validDays * 24 * 60 * 60 * 1000);

    const payload: LicensePayload = {
      tenantId: params.tenantId,
      propertyId: params.propertyId,
      hotelName: params.hotelName,
      tier: params.tier,
      maxRooms: params.maxRooms,
      maxDeviceSeats: params.maxDeviceSeats,
      enabledFeatures: params.enabledFeatures,
      issuedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      gracePeriodDays: 5,
    };

    const licenseToken = LicenseSigner.signLicense(payload, this.keyPair.privateKeyPem);

    return {
      licenseToken,
      payload,
      publicKeyPem: this.keyPair.publicKeyPem,
    };
  }
}
