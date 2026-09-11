import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { FolioItemType, FolioLedger, PaymentMethod } from '@hospware/core-domain';
import { generateUUIDv7 } from '@hospware/database';
import { ReceiptTemplates, MockPrinterTransport } from '@hospware/escpos-printer';
import { HubSyncEngine } from '../sync-engine';

export function registerFolioRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine,
  broadcast: (event: string, data: any) => void
) {
  // GET folio details with items
  server.get('/api/folios/:id', async (request: any, reply) => {
    const { id } = request.params;
    const folio = sqlite.prepare(`
      SELECT f.*, g.first_name, g.last_name, g.phone, r.room_number
      FROM folios f
      JOIN guests g ON f.guest_id = g.id
      JOIN reservations res ON f.reservation_id = res.id
      LEFT JOIN rooms r ON res.room_id = r.id
      WHERE f.id = ?
    `).get(id) as any;

    if (!folio) {
      return reply.status(404).send({ success: false, error: 'Folio not found' });
    }

    const items = sqlite.prepare(`
      SELECT * FROM folio_items WHERE folio_id = ? ORDER BY created_at ASC
    `).all(id) as any[];

    const totals = FolioLedger.calculateTotals(items);

    return reply.send({
      success: true,
      data: {
        ...folio,
        guestName: `${folio.first_name} ${folio.last_name}`,
        roomNumber: folio.room_number,
        items,
        calculatedTotals: totals,
      },
    });
  });

  // POST add charge to folio
  server.post('/api/folios/:id/charges', async (request: any, reply) => {
    const { id } = request.params;
    const {
      type = FolioItemType.CUSTOM_CHARGE,
      description,
      quantity = 1,
      unitPrice,
      taxAmount = 0,
      userId = 'usr-2',
    } = request.body;

    const folio = sqlite.prepare('SELECT * FROM folios WHERE id = ?').get(id) as any;
    if (!folio) {
      return reply.status(404).send({ success: false, error: 'Folio not found' });
    }

    const now = new Date().toISOString();
    const itemId = generateUUIDv7();
    const totalAmount = Math.round(unitPrice * quantity * 100) / 100;

    sqlite.prepare(`
      INSERT INTO folio_items (id, folio_id, type, description, quantity, unit_price, total_amount, tax_amount, created_by_user_id, is_voided, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(itemId, id, type, description, quantity, unitPrice, totalAmount, taxAmount, userId, now);

    // Recalculate folio totals
    const allItems = sqlite.prepare('SELECT * FROM folio_items WHERE folio_id = ?').all(id) as any[];
    const totals = FolioLedger.calculateTotals(allItems);

    sqlite.prepare(`
      UPDATE folios
      SET total_charges = ?, total_taxes = ?, total_payments = ?, total_discounts = ?, balance_due = ?, updated_at = ?
      WHERE id = ?
    `).run(totals.totalCharges, totals.totalTaxes, totals.totalPayments, totals.totalDiscounts, totals.balanceDue, now, id);

    syncEngine.recordOutboxEvent('FOLIO_ITEM', itemId, 'INSERT', { id: itemId, folioId: id, totalAmount, description });
    broadcast('FOLIO_UPDATED', { folioId: id, balanceDue: totals.balanceDue });

    return reply.send({ success: true, data: { itemId, totals } });
  });

  // POST add payment to folio
  server.post('/api/folios/:id/payments', async (request: any, reply) => {
    const { id } = request.params;
    const {
      amount,
      paymentMethod = PaymentMethod.CASH,
      paymentReference,
      description,
      userId = 'usr-2',
    } = request.body;

    const folio = sqlite.prepare('SELECT * FROM folios WHERE id = ?').get(id) as any;
    if (!folio) {
      return reply.status(404).send({ success: false, error: 'Folio not found' });
    }

    const now = new Date().toISOString();
    const itemId = generateUUIDv7();

    const tx = sqlite.transaction(() => {
      sqlite.prepare(`
        INSERT INTO folio_items (id, folio_id, type, description, quantity, unit_price, total_amount, tax_amount, payment_method, payment_reference, created_by_user_id, is_voided, created_at)
        VALUES (?, ?, 'PAYMENT', ?, 1, ?, ?, 0, ?, ?, ?, 0, ?)
      `).run(itemId, id, description || `Payment via ${paymentMethod}`, amount, amount, paymentMethod, paymentReference || null, userId, now);

      // Record in cash transaction if Cash payment
      if (paymentMethod === PaymentMethod.CASH) {
        const activeShift = sqlite.prepare("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get() as any;
        if (activeShift) {
          sqlite.prepare(`
            INSERT INTO cash_transactions (id, shift_id, property_id, type, amount, description, related_folio_id, authorized_by_user_id, created_at)
            VALUES (?, ?, ?, 'PAYMENT_RECEIVED', ?, ?, ?, ?, ?)
          `).run(generateUUIDv7(), activeShift.id, folio.property_id, amount, description || `Payment on Folio ${id}`, id, userId, now);
        }
      }

      // Recalculate folio
      const allItems = sqlite.prepare('SELECT * FROM folio_items WHERE folio_id = ?').all(id) as any[];
      const totals = FolioLedger.calculateTotals(allItems);

      sqlite.prepare(`
        UPDATE folios
        SET total_charges = ?, total_taxes = ?, total_payments = ?, total_discounts = ?, balance_due = ?, updated_at = ?
        WHERE id = ?
      `).run(totals.totalCharges, totals.totalTaxes, totals.totalPayments, totals.totalDiscounts, totals.balanceDue, now, id);
    });

    tx();

    const updatedFolio = sqlite.prepare('SELECT * FROM folios WHERE id = ?').get(id) as any;
    syncEngine.recordOutboxEvent('FOLIO', id, 'UPDATE', { id, balanceDue: updatedFolio.balance_due });
    broadcast('FOLIO_UPDATED', { folioId: id, balanceDue: updatedFolio.balance_due });

    return reply.send({ success: true, data: { itemId, balanceDue: updatedFolio.balance_due } });
  });

  // POST print thermal receipt
  server.post('/api/folios/:id/print-receipt', async (request: any, reply) => {
    const { id } = request.params;
    const folio = sqlite.prepare(`
      SELECT f.*, g.first_name, g.last_name, res.check_in_date, res.check_out_date, r.room_number, p.name as hotel_name, p.address, p.phone
      FROM folios f
      JOIN guests g ON f.guest_id = g.id
      JOIN reservations res ON f.reservation_id = res.id
      LEFT JOIN rooms r ON res.room_id = r.id
      JOIN properties p ON f.property_id = p.id
      WHERE f.id = ?
    `).get(id) as any;

    if (!folio) {
      return reply.status(404).send({ success: false, error: 'Folio not found' });
    }

    const items = sqlite.prepare('SELECT * FROM folio_items WHERE folio_id = ? AND is_voided = 0').all(id) as any[];
    const totals = FolioLedger.calculateTotals(items);

    const receiptBuffer = ReceiptTemplates.buildFolioInvoice({
      header: {
        hotelName: folio.hotel_name,
        address: folio.address || undefined,
        phone: folio.phone || undefined,
      },
      invoiceNumber: `INV-${folio.id.substring(0, 8).toUpperCase()}`,
      roomNumber: folio.room_number || 'N/A',
      guestName: `${folio.first_name} ${folio.last_name}`,
      checkInDate: folio.check_in_date,
      checkOutDate: folio.check_out_date,
      currency: folio.currency,
      items: items.map((i) => ({ description: i.description, quantity: i.quantity, amount: i.total_amount })),
      totalCharges: totals.totalCharges,
      totalTaxes: totals.totalTaxes,
      totalDiscounts: totals.totalDiscounts,
      totalPayments: totals.totalPayments,
      balanceDue: totals.balanceDue,
      cashierName: 'Front Desk',
      issuedAt: new Date().toLocaleDateString(),
    });

    // Send to printer transport (mock or local USB/LAN socket)
    const mockTransport = new MockPrinterTransport();
    await mockTransport.send(receiptBuffer);

    return reply.send({
      success: true,
      message: 'Thermal receipt sent to printer',
      receiptBase64: receiptBuffer.toString('base64'),
    });
  });
}
