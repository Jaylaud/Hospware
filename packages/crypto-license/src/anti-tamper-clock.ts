import crypto from 'node:crypto';
import { StoredClockRecord } from './types';

export class AntiTamperClock {
  /**
   * Generates a cryptographic sequence hash for the new transaction timestamp.
   */
  public static generateSequenceHash(
    previousHash: string,
    currentTimestamp: string,
    transactionCount: number
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${previousHash}:${currentTimestamp}:${transactionCount}`)
      .digest('hex');
  }

  /**
   * Checks if current system clock has been moved backward relative to last known good record.
   * Allows up to 10 minutes drift tolerance for legitimate NTP adjustments.
   */
  public static verifySystemClock(
    lastRecord: StoredClockRecord | null,
    currentSystemTime: Date = new Date()
  ): { isTampered: boolean; reason?: string } {
    if (!lastRecord) {
      return { isTampered: false };
    }

    const lastTimeMs = new Date(lastRecord.lastKnownTimestamp).getTime();
    const currentTimeMs = currentSystemTime.getTime();

    // 10 minutes (600,000 ms) drift tolerance
    const toleranceMs = 10 * 60 * 1000;

    if (currentTimeMs < lastTimeMs - toleranceMs) {
      const diffHours = Math.round((lastTimeMs - currentTimeMs) / (1000 * 60 * 60) * 10) / 10;
      return {
        isTampered: true,
        reason: `System clock is rolled back by ~${diffHours} hours compared to last recorded operation (${lastRecord.lastKnownTimestamp}).`,
      };
    }

    return { isTampered: false };
  }
}
