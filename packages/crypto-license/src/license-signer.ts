import crypto from 'node:crypto';
import { LicensePayload } from './types';

export class LicenseSigner {
  /**
   * Generates a new Ed25519 keypair formatted as PEM strings.
   */
  public static generateKeyPair(): { publicKeyPem: string; privateKeyPem: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      publicKeyPem: publicKey,
      privateKeyPem: privateKey,
    };
  }

  /**
   * Signs a license payload using the Cloud SaaS Ed25519 private key.
   * Returns a portable Base64URL license token.
   */
  public static signLicense(payload: LicensePayload, privateKeyPem: string): string {
    const jsonPayload = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(jsonPayload, 'utf-8').toString('base64url');

    const signature = crypto.sign(null, Buffer.from(payloadBase64, 'utf-8'), privateKeyPem);
    const signatureBase64 = signature.toString('base64url');

    return `${payloadBase64}.${signatureBase64}`;
  }
}
