import { CashTransaction } from './types';

export interface ShiftClosingResult {
  openingCashFloat: number;
  totalCashReceived: number;
  totalCashPayouts: number;
  expectedClosingCash: number;
  actualBlindDropCash: number;
  cashVariance: number; // actual - expected (positive = surplus/overage, negative = shortage)
  status: 'BALANCED' | 'SHORTAGE' | 'OVERAGE';
  isAuditFlagged: boolean;
}

export class ShiftReconciliation {
  /**
   * Computes expected cash in drawer based on cash float and cash ledger entries.
   */
  public static calculateExpectedCash(
    openingFloat: number,
    transactions: CashTransaction[]
  ): { expectedCash: number; totalReceived: number; totalPayouts: number } {
    let totalReceived = 0;
    let totalPayouts = 0;

    for (const tx of transactions) {
      if (tx.type === 'PAYMENT_RECEIVED' || tx.type === 'FLOAT_ADJUSTMENT') {
        totalReceived += tx.amount;
      } else if (tx.type === 'PAYOUT_EXPENSE' || tx.type === 'REFUND') {
        totalPayouts += tx.amount;
      }
    }

    const expectedCash = Math.round((openingFloat + totalReceived - totalPayouts) * 100) / 100;

    return {
      expectedCash,
      totalReceived: Math.round(totalReceived * 100) / 100,
      totalPayouts: Math.round(totalPayouts * 100) / 100,
    };
  }

  /**
   * Executes blind cash drop calculation without revealing expected numbers before entry.
   */
  public static processBlindDrop(params: {
    openingFloat: number;
    transactions: CashTransaction[];
    actualCountedCash: number;
    varianceThreshold?: number; // e.g. flag if variance > $5 / GHS 20
  }): ShiftClosingResult {
    const { openingFloat, transactions, actualCountedCash, varianceThreshold = 2.0 } = params;
    const { expectedCash, totalReceived, totalPayouts } = this.calculateExpectedCash(openingFloat, transactions);

    const cashVariance = Math.round((actualCountedCash - expectedCash) * 100) / 100;
    let status: 'BALANCED' | 'SHORTAGE' | 'OVERAGE' = 'BALANCED';

    if (cashVariance > 0.01) {
      status = 'OVERAGE';
    } else if (cashVariance < -0.01) {
      status = 'SHORTAGE';
    }

    const isAuditFlagged = Math.abs(cashVariance) > varianceThreshold;

    return {
      openingCashFloat: openingFloat,
      totalCashReceived: totalReceived,
      totalCashPayouts: totalPayouts,
      expectedClosingCash: expectedCash,
      actualBlindDropCash: actualCountedCash,
      cashVariance,
      status,
      isAuditFlagged,
    };
  }
}
