import { TaxRule } from './types';

export interface RateCalculationParams {
  basePrice: number;
  nightsCount: number;
  adultsCount: number;
  extraAdultCharge?: number;
  seasonalMultiplier?: number;
  discountPercentage?: number;
  discountFlatAmount?: number;
  taxRules: TaxRule[];
}

export interface CalculatedRateBreakdown {
  grossRoomAmount: number;
  discountTotal: number;
  netRoomAmount: number;
  taxes: {
    ruleId: string;
    name: string;
    ratePercentage: number;
    amount: number;
  }[];
  totalTaxAmount: number;
  grandTotal: number;
}

export class PricingEngine {
  /**
   * Calculates detailed room rate breakdown with multi-tier taxes and discounts.
   */
  public static calculateStayRate(params: RateCalculationParams): CalculatedRateBreakdown {
    const {
      basePrice,
      nightsCount,
      adultsCount,
      extraAdultCharge = 0,
      seasonalMultiplier = 1.0,
      discountPercentage = 0,
      discountFlatAmount = 0,
      taxRules,
    } = params;

    // 1. Base amount across nights
    const standardOccupancy = 2;
    const extraAdults = Math.max(0, adultsCount - standardOccupancy);
    const nightlyPrice = (basePrice + (extraAdults * extraAdultCharge)) * seasonalMultiplier;
    const grossRoomAmount = Math.round(nightlyPrice * nightsCount * 100) / 100;

    // 2. Discounts
    let percentageDiscountAmount = (grossRoomAmount * Math.min(100, Math.max(0, discountPercentage))) / 100;
    let totalDiscount = Math.min(grossRoomAmount, percentageDiscountAmount + discountFlatAmount);
    totalDiscount = Math.round(totalDiscount * 100) / 100;

    const netRoomAmount = Math.max(0, grossRoomAmount - totalDiscount);

    // 3. Tax Breakdown
    const activeRules = taxRules.filter(
      (r) => r.enabled && (r.appliesTo.includes('ROOM') || r.appliesTo.includes('ALL'))
    );

    let totalTaxAmount = 0;
    const taxes = activeRules.map((rule) => {
      const taxableBase = rule.isCompounded ? netRoomAmount + totalTaxAmount : netRoomAmount;
      const amount = Math.round(((taxableBase * rule.ratePercentage) / 100) * 100) / 100;
      totalTaxAmount += amount;
      return {
        ruleId: rule.id,
        name: rule.name,
        ratePercentage: rule.ratePercentage,
        amount,
      };
    });

    totalTaxAmount = Math.round(totalTaxAmount * 100) / 100;
    const grandTotal = Math.round((netRoomAmount + totalTaxAmount) * 100) / 100;

    return {
      grossRoomAmount,
      discountTotal: totalDiscount,
      netRoomAmount,
      taxes,
      totalTaxAmount,
      grandTotal,
    };
  }

  /**
   * Calculates standard VAT and Tourism tax on POS/bar items
   */
  public static calculatePosItemTotal(
    unitPrice: number,
    quantity: number,
    taxRules: TaxRule[]
  ): { subtotal: number; taxAmount: number; totalAmount: number } {
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    const activeRules = taxRules.filter(
      (r) => r.enabled && (r.appliesTo.includes('POS') || r.appliesTo.includes('ALL'))
    );

    let taxAmount = 0;
    for (const rule of activeRules) {
      taxAmount += Math.round(((subtotal * rule.ratePercentage) / 100) * 100) / 100;
    }

    return {
      subtotal,
      taxAmount,
      totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
    };
  }
}
