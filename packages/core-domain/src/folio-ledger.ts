import { Folio, FolioItem, FolioItemType, PaymentMethod } from './types';

export class FolioLedger {
  /**
   * Recalculates total charges, taxes, payments, discounts, and outstanding balance for a folio.
   */
  public static calculateTotals(items: FolioItem[]): {
    totalCharges: number;
    totalTaxes: number;
    totalPayments: number;
    totalDiscounts: number;
    balanceDue: number;
  } {
    let totalCharges = 0;
    let totalTaxes = 0;
    let totalPayments = 0;
    let totalDiscounts = 0;

    for (const item of items) {
      if (item.isVoided) continue;

      switch (item.type) {
        case FolioItemType.ROOM_CHARGE:
        case FolioItemType.POS_RESTAURANT:
        case FolioItemType.POS_BAR:
        case FolioItemType.LAUNDRY:
        case FolioItemType.MINIBAR:
        case FolioItemType.LATE_CHECKOUT:
        case FolioItemType.EARLY_CHECKIN:
        case FolioItemType.DAMAGE_FEE:
        case FolioItemType.CUSTOM_CHARGE:
          totalCharges += item.totalAmount;
          totalTaxes += item.taxAmount || 0;
          break;

        case FolioItemType.TAX_VAT:
        case FolioItemType.TAX_TOURISM:
        case FolioItemType.SERVICE_CHARGE:
          totalTaxes += item.totalAmount;
          break;

        case FolioItemType.DISCOUNT:
          totalDiscounts += Math.abs(item.totalAmount);
          break;

        case FolioItemType.PAYMENT:
          totalPayments += Math.abs(item.totalAmount);
          break;

        case FolioItemType.REFUND:
          totalPayments -= Math.abs(item.totalAmount);
          break;
      }
    }

    totalCharges = Math.round(totalCharges * 100) / 100;
    totalTaxes = Math.round(totalTaxes * 100) / 100;
    totalPayments = Math.round(totalPayments * 100) / 100;
    totalDiscounts = Math.round(totalDiscounts * 100) / 100;

    const balanceDue = Math.round((totalCharges + totalTaxes - totalDiscounts - totalPayments) * 100) / 100;

    return {
      totalCharges,
      totalTaxes,
      totalPayments,
      totalDiscounts,
      balanceDue,
    };
  }

  /**
   * Helper to construct a new charge line item
   */
  public static createChargeItem(params: {
    id: string;
    folioId: string;
    type: FolioItemType;
    description: string;
    unitPrice: number;
    quantity?: number;
    taxAmount?: number;
    userId: string;
  }): FolioItem {
    const quantity = params.quantity ?? 1;
    const totalAmount = Math.round(params.unitPrice * quantity * 100) / 100;

    return {
      id: params.id,
      folioId: params.folioId,
      type: params.type,
      description: params.description,
      quantity,
      unitPrice: params.unitPrice,
      totalAmount,
      taxAmount: params.taxAmount || 0,
      createdByUserId: params.userId,
      isVoided: false,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to construct a new payment line item
   */
  public static createPaymentItem(params: {
    id: string;
    folioId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    description?: string;
    userId: string;
  }): FolioItem {
    return {
      id: params.id,
      folioId: params.folioId,
      type: FolioItemType.PAYMENT,
      description: params.description || `Payment via ${params.paymentMethod}`,
      quantity: 1,
      unitPrice: params.amount,
      totalAmount: params.amount,
      taxAmount: 0,
      paymentMethod: params.paymentMethod,
      paymentReference: params.paymentReference,
      createdByUserId: params.userId,
      isVoided: false,
      createdAt: new Date().toISOString(),
    };
  }
}
