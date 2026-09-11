import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EscPosBuilder, ReceiptTemplates } from '../index';

describe('ESC/POS Builder', () => {
  it('generates standard byte sequences', () => {
    const builder = new EscPosBuilder({ paperWidth: '80mm' });
    builder
      .align('center')
      .bold(true)
      .text('HOTEL INVOICE')
      .cut();

    const buf = builder.toBuffer();
    assert.ok(buf instanceof Buffer);
    assert.ok(buf.length > 0);

    // Initial ESC @ sequence: 0x1B, 0x40
    assert.strictEqual(buf[0], 0x1b);
    assert.strictEqual(buf[1], 0x40);
  });

  it('builds valid Folio invoice receipts', () => {
    const buf = ReceiptTemplates.buildFolioInvoice({
      header: { hotelName: 'Grand Horizon Hotel' },
      invoiceNumber: 'INV-1002',
      roomNumber: '101',
      guestName: 'John Doe',
      checkInDate: '2026-09-11',
      checkOutDate: '2026-09-13',
      currency: 'USD',
      items: [{ description: 'Room 101 - 2 Nights', quantity: 1, amount: 130 }],
      totalCharges: 130,
      totalTaxes: 0,
      totalDiscounts: 0,
      totalPayments: 130,
      balanceDue: 0,
      cashierName: 'Front Desk',
      issuedAt: '2026-09-11',
    });

    assert.ok(buf.length > 50);
  });
});
