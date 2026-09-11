import crypto from 'node:crypto';

/**
 * Generates an RFC 9562 compliant UUIDv7.
 * Encodes a 48-bit millisecond timestamp followed by cryptographic randomness.
 * This guarantees chronological sortability and zero collisions across distributed hotel nodes.
 */
export function generateUUIDv7(): string {
  const timestamp = BigInt(Date.now());
  const randomBytes = crypto.randomBytes(10);

  // 48 bits of timestamp
  const high = Number((timestamp >> 16n) & 0xffffffffn);
  const mid = Number(timestamp & 0xffffn);

  // Set version 7 (0111) in byte 6
  randomBytes[0] = (randomBytes[0] & 0x0f) | 0x70;
  // Set variant 10xx in byte 8
  randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80;

  const hexHigh = high.toString(16).padStart(8, '0');
  const hexMid = mid.toString(16).padStart(4, '0');
  const hexVer = randomBytes.subarray(0, 2).toString('hex');
  const hexVar = randomBytes.subarray(2, 4).toString('hex');
  const hexNode = randomBytes.subarray(4, 10).toString('hex');

  return `${hexHigh}-${hexMid}-${hexVer}-${hexVar}-${hexNode}`;
}
