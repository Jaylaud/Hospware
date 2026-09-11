import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  RoomStateMachine, 
  RoomStatus, 
  UserRole,
  PricingEngine, 
  FolioLedger, 
  FolioItemType, 
  KPICalculator, 
  ShiftReconciliation,
  PaymentMethod
} from '../index';

describe('Room State Machine', () => {
  it('allows Housekeeper to start cleaning a dirty room', () => {
    const canClean = RoomStateMachine.canTransition(
      RoomStatus.VACANT_DIRTY,
      RoomStatus.CLEANING_IN_PROGRESS,
      UserRole.HOUSEKEEPER
    );
    assert.strictEqual(canClean, true);
  });

  it('prohibits Housekeeper from directly checking in a guest', () => {
    const canCheckIn = RoomStateMachine.canTransition(
      RoomStatus.VACANT_CLEAN,
      RoomStatus.OCCUPIED_CLEAN,
      UserRole.HOUSEKEEPER
    );
    assert.strictEqual(canCheckIn, false);
  });

  it('allows Front Desk to check in a clean room', () => {
    const canCheckIn = RoomStateMachine.canTransition(
      RoomStatus.VACANT_CLEAN,
      RoomStatus.OCCUPIED_CLEAN,
      UserRole.FRONT_DESK
    );
    assert.strictEqual(canCheckIn, true);
  });

  it('provides quick action status progression for housekeeping', () => {
    assert.strictEqual(
      RoomStateMachine.getNextQuickHousekeepingStatus(RoomStatus.VACANT_DIRTY),
      RoomStatus.CLEANING_IN_PROGRESS
    );
    assert.strictEqual(
      RoomStateMachine.getNextQuickHousekeepingStatus(RoomStatus.CLEANING_IN_PROGRESS),
      RoomStatus.VACANT_CLEAN
    );
  });
});

describe('Pricing Engine', () => {
  it('calculates stay rates with taxes and discounts', () => {
    const result = PricingEngine.calculateStayRate({
      basePrice: 100,
      nightsCount: 3,
      adultsCount: 2,
      discountPercentage: 10,
      taxRules: [
        {
          id: 'tax-vat',
          name: 'VAT',
          code: 'VAT',
          ratePercentage: 15,
          isCompounded: false,
          appliesTo: ['ROOM'],
          enabled: true,
        },
      ],
    });

    assert.strictEqual(result.grossRoomAmount, 300);
    assert.strictEqual(result.discountTotal, 30);
    assert.strictEqual(result.netRoomAmount, 270);
    assert.strictEqual(result.totalTaxAmount, 40.5);
    assert.strictEqual(result.grandTotal, 310.5);
  });
});

describe('Folio Ledger', () => {
  it('correctly calculates balances with charges and payments', () => {
    const items = [
      FolioLedger.createChargeItem({
        id: '1',
        folioId: 'f1',
        type: FolioItemType.ROOM_CHARGE,
        description: 'Room 101 - 2 nights',
        unitPrice: 100,
        quantity: 2,
        userId: 'u1',
      }),
      FolioLedger.createChargeItem({
        id: '2',
        folioId: 'f1',
        type: FolioItemType.POS_RESTAURANT,
        description: 'Dinner at Bar',
        unitPrice: 35,
        quantity: 1,
        userId: 'u1',
      }),
      FolioLedger.createPaymentItem({
        id: '3',
        folioId: 'f1',
        amount: 150,
        paymentMethod: PaymentMethod.CASH,
        userId: 'u1',
      }),
    ];

    const totals = FolioLedger.calculateTotals(items);
    assert.strictEqual(totals.totalCharges, 235);
    assert.strictEqual(totals.totalPayments, 150);
    assert.strictEqual(totals.balanceDue, 85);
  });
});

describe('KPI Calculator', () => {
  it('accurately computes ADR and RevPAR', () => {
    const kpi = KPICalculator.calculateMetrics({
      totalRooms: 10,
      outOfOrderRooms: 0,
      occupiedRooms: 8,
      roomRevenue: 800,
      fnbRevenue: 200,
      otherRevenue: 50,
    });

    assert.strictEqual(kpi.occupancyRate, 80);
    assert.strictEqual(kpi.adr, 100);
    assert.strictEqual(kpi.revPar, 80);
    assert.strictEqual(kpi.totalGrossRevenue, 1050);
    assert.strictEqual(kpi.tRevPar, 105);
  });
});

describe('Shift Reconciliation & Blind Drop', () => {
  it('detects balanced shifts and variances', () => {
    const result = ShiftReconciliation.processBlindDrop({
      openingFloat: 100,
      transactions: [
        {
          id: 'tx1',
          shiftId: 's1',
          propertyId: 'p1',
          type: 'PAYMENT_RECEIVED',
          amount: 150,
          description: 'Guest cash payment',
          authorizedByUserId: 'u1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tx2',
          shiftId: 's1',
          propertyId: 'p1',
          type: 'PAYOUT_EXPENSE',
          amount: 20,
          description: 'Laundry supplies cash payout',
          authorizedByUserId: 'u1',
          createdAt: new Date().toISOString(),
        },
      ],
      actualCountedCash: 230,
    });

    assert.strictEqual(result.expectedClosingCash, 230);
    assert.strictEqual(result.cashVariance, 0);
    assert.strictEqual(result.status, 'BALANCED');
    assert.strictEqual(result.isAuditFlagged, false);
  });

  it('flags shortage audit when cash is missing', () => {
    const result = ShiftReconciliation.processBlindDrop({
      openingFloat: 100,
      transactions: [],
      actualCountedCash: 80, // Missing $20
      varianceThreshold: 5,
    });

    assert.strictEqual(result.cashVariance, -20);
    assert.strictEqual(result.status, 'SHORTAGE');
    assert.strictEqual(result.isAuditFlagged, true);
  });
});
