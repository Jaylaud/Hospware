import { EscPosBuilder, PrinterPaperWidth } from './escpos-builder';

export interface HotelReceiptHeader {
  hotelName: string;
  address?: string;
  phone?: string;
  taxId?: string;
  website?: string;
}

export interface FolioInvoiceData {
  header: HotelReceiptHeader;
  invoiceNumber: string;
  roomNumber: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  currency: string;
  items: {
    description: string;
    quantity: number;
    amount: number;
  }[];
  totalCharges: number;
  totalTaxes: number;
  totalDiscounts: number;
  totalPayments: number;
  balanceDue: number;
  cashierName: string;
  issuedAt: string;
  footerNote?: string;
}

export interface ShiftHandoverData {
  header: HotelReceiptHeader;
  shiftId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string;
  currency: string;
  openingFloat: number;
  totalCashReceived: number;
  totalCashPayouts: number;
  expectedCash: number;
  actualBlindDrop: number;
  variance: number;
  status: 'BALANCED' | 'SHORTAGE' | 'OVERAGE';
  paymentSummary: { method: string; amount: number }[];
}

export interface KitchenOrderData {
  orderNumber: string;
  tableOrRoom: string;
  serverName: string;
  timestamp: string;
  items: { name: string; quantity: number; notes?: string }[];
}

export class ReceiptTemplates {
  /**
   * Generates a complete Folio Checkout Invoice
   */
  public static buildFolioInvoice(data: FolioInvoiceData, width: PrinterPaperWidth = '80mm'): Buffer {
    const p = new EscPosBuilder({ paperWidth: width });

    // Header
    p.align('center')
      .size(2, 2)
      .bold(true)
      .text(data.header.hotelName)
      .size(1, 1)
      .bold(false);

    if (data.header.address) p.text(data.header.address);
    if (data.header.phone) p.text(`Tel: ${data.header.phone}`);
    if (data.header.taxId) p.text(`Tax ID/TIN: ${data.header.taxId}`);

    p.newLine(1)
      .rule('=')
      .bold(true)
      .text('GUEST FOLIO INVOICE')
      .bold(false)
      .rule('=');

    // Metadata
    p.align('left')
      .row('Invoice #:', data.invoiceNumber)
      .row('Room #:', data.roomNumber)
      .row('Guest:', data.guestName)
      .row('Stay:', `${data.checkInDate} to ${data.checkOutDate}`)
      .row('Cashier:', data.cashierName)
      .row('Date:', data.issuedAt)
      .rule('-');

    // Line items table
    p.tableRow3('DESCRIPTION', 'QTY', 'AMOUNT');
    p.rule('-');

    for (const item of data.items) {
      const amtStr = `${data.currency} ${item.amount.toFixed(2)}`;
      p.tableRow3(item.description, item.quantity.toString(), amtStr);
    }

    p.rule('-');

    // Summary Totals
    p.row('Subtotal Charges:', `${data.currency} ${data.totalCharges.toFixed(2)}`);
    if (data.totalTaxes > 0) {
      p.row('Taxes & Levies:', `${data.currency} ${data.totalTaxes.toFixed(2)}`);
    }
    if (data.totalDiscounts > 0) {
      p.row('Discounts:', `-${data.currency} ${data.totalDiscounts.toFixed(2)}`);
    }
    p.row('Payments Received:', `-${data.currency} ${data.totalPayments.toFixed(2)}`);
    p.rule('=');

    // Balance Due
    p.size(1, 2)
      .bold(true)
      .row('BALANCE DUE:', `${data.currency} ${data.balanceDue.toFixed(2)}`)
      .size(1, 1)
      .bold(false);

    p.rule('=');

    // Signatures & Footer
    p.newLine(1)
      .text('Guest Signature: _______________________')
      .newLine(1)
      .align('center')
      .text(data.footerNote || 'Thank you for staying with us!')
      .cut();

    return p.toBuffer();
  }

  /**
   * Generates a Shift Handover / Blind Drop Report
   */
  public static buildShiftReport(data: ShiftHandoverData, width: PrinterPaperWidth = '80mm'): Buffer {
    const p = new EscPosBuilder({ paperWidth: width });

    p.align('center')
      .bold(true)
      .size(2, 2)
      .text(data.header.hotelName)
      .size(1, 1)
      .text('SHIFT RECONCILIATION REPORT')
      .bold(false)
      .rule('=');

    p.align('left')
      .row('Shift ID:', data.shiftId.substring(0, 8))
      .row('Staff:', data.cashierName)
      .row('Opened:', data.openedAt)
      .row('Closed:', data.closedAt)
      .rule('-');

    p.bold(true).text('CASH DRAWER RECONCILIATION:').bold(false);
    p.row('Opening Cash Float:', `${data.currency} ${data.openingFloat.toFixed(2)}`);
    p.row('+ Cash Sales/Received:', `${data.currency} ${data.totalCashReceived.toFixed(2)}`);
    p.row('- Cash Payouts/Refunds:', `${data.currency} ${data.totalCashPayouts.toFixed(2)}`);
    p.rule('-');
    p.bold(true).row('Expected Cash:', `${data.currency} ${data.expectedCash.toFixed(2)}`).bold(false);
    p.row('Actual Blind Drop:', `${data.currency} ${data.actualBlindDrop.toFixed(2)}`);
    p.rule('=');

    const varianceStr = `${data.variance >= 0 ? '+' : ''}${data.currency} ${data.variance.toFixed(2)}`;
    p.size(1, 2)
      .bold(true)
      .row(`VARIANCE (${data.status}):`, varianceStr)
      .size(1, 1)
      .bold(false);

    p.rule('-');
    p.bold(true).text('COLLECTIONS BY PAYMENT TYPE:').bold(false);
    for (const pmt of data.paymentSummary) {
      p.row(pmt.method, `${data.currency} ${pmt.amount.toFixed(2)}`);
    }

    p.newLine(2)
      .text('Staff Signature:     ___________________')
      .newLine(1)
      .text('Manager Signature:   ___________________')
      .cut();

    return p.toBuffer();
  }

  /**
   * Generates Kitchen Order Ticket (KOT)
   */
  public static buildKitchenOrder(data: KitchenOrderData, width: PrinterPaperWidth = '80mm'): Buffer {
    const p = new EscPosBuilder({ paperWidth: width });

    p.align('center')
      .size(2, 2)
      .bold(true)
      .text('*** KITCHEN ORDER ***')
      .size(1, 2)
      .text(`ROOM/TABLE: ${data.tableOrRoom}`)
      .size(1, 1)
      .bold(false)
      .rule('=');

    p.align('left')
      .row('Order #:', data.orderNumber)
      .row('Server:', data.serverName)
      .row('Time:', data.timestamp)
      .rule('-');

    for (const item of data.items) {
      p.bold(true)
        .text(`[ ${item.quantity}x ]  ${item.name}`)
        .bold(false);

      if (item.notes) {
        p.text(`   >> Note: ${item.notes}`);
      }
      p.newLine(1);
    }

    p.rule('=')
      .cut();

    return p.toBuffer();
  }
}
