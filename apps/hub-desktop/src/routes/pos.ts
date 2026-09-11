import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { FolioItemType, PaymentMethod, FolioLedger } from '@hospware/core-domain';
import { generateUUIDv7 } from '@hospware/database';
import { ReceiptTemplates, MockPrinterTransport } from '@hospware/escpos-printer';
import { HubSyncEngine } from '../sync-engine';

export const POS_MENU_CATALOG = [
  { id: 'pos-1', category: 'Breakfast & Meals', name: 'Continental Breakfast Platter', price: 12.0 },
  { id: 'pos-2', category: 'Breakfast & Meals', name: 'Jollof Rice with Grilled Chicken', price: 15.0 },
  { id: 'pos-3', category: 'Breakfast & Meals', name: 'Club Sandwich with Fries', price: 10.0 },
  { id: 'pos-4', category: 'Drinks & Bar', name: 'Fresh Tropical Fruit Smoothie', price: 5.0 },
  { id: 'pos-5', category: 'Drinks & Bar', name: 'Local Draft Beer (500ml)', price: 4.5 },
  { id: 'pos-6', category: 'Drinks & Bar', name: 'Signature House Cocktail', price: 9.0 },
  { id: 'pos-7', category: 'Snacks', name: 'Spicy Chicken Wings (6pcs)', price: 8.5 },
  { id: 'pos-8', category: 'Snacks', name: 'Plantain Chips & Guacamole', price: 6.0 },
];

export function registerPosRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine,
  broadcast: (event: string, data: any) => void
) {
  // GET menu items
  server.get('/api/pos/menu', async (request, reply) => {
    return reply.send({ success: true, data: POS_MENU_CATALOG });
  });

  // GET active occupied rooms for room charge routing
  server.get('/api/pos/occupied-rooms', async (request, reply) => {
    const rooms = sqlite.prepare(`
      SELECT r.id, r.room_number, res.id as reservation_id, g.first_name, g.last_name, f.id as folio_id
      FROM rooms r
      JOIN reservations res ON r.current_reservation_id = res.id
      JOIN guests g ON res.guest_id = g.id
      JOIN folios f ON f.reservation_id = res.id
      WHERE r.status LIKE 'OCCUPIED%' AND f.status = 'OPEN'
      ORDER BY r.room_number ASC
    `).all() as any[];

    const formatted = rooms.map((r) => ({
      roomId: r.id,
      roomNumber: r.room_number,
      reservationId: r.reservation_id,
      folioId: r.folio_id,
      guestName: `${r.first_name} ${r.last_name}`,
    }));

    return reply.send({ success: true, data: formatted });
  });

  // POST place POS order
  server.post('/api/pos/orders', async (request: any, reply) => {
    const {
      destinationType, // 'ROOM_CHARGE' | 'WALK_IN_CASH' | 'PAYSTACK'
      targetRoomFolioId,
      roomNumber,
      items, // Array of { id, name, price, quantity, notes }
      serverName = 'Bar Server',
      userId = 'usr-4',
    } = request.body;

    const now = new Date().toISOString();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    let totalOrderAmount = 0;

    for (const item of items) {
      totalOrderAmount += item.price * item.quantity;
    }
    totalOrderAmount = Math.round(totalOrderAmount * 100) / 100;

    // 1. If destination is room charge, post line items into folio
    if (destinationType === 'ROOM_CHARGE' && targetRoomFolioId) {
      const folio = sqlite.prepare('SELECT * FROM folios WHERE id = ?').get(targetRoomFolioId) as any;
      if (!folio) {
        return reply.status(404).send({ success: false, error: 'Target room folio not found' });
      }

      const tx = sqlite.transaction(() => {
        for (const item of items) {
          const itemId = generateUUIDv7();
          const itemTotal = Math.round(item.price * item.quantity * 100) / 100;

          sqlite.prepare(`
            INSERT INTO folio_items (id, folio_id, type, description, quantity, unit_price, total_amount, tax_amount, created_by_user_id, is_voided, created_at)
            VALUES (?, ?, 'POS_RESTAURANT', ?, ?, ?, ?, 0, ?, 0, ?)
          `).run(itemId, targetRoomFolioId, `[Bar/POS] ${item.name}`, item.quantity, item.price, itemTotal, userId, now);
        }

        const allItems = sqlite.prepare('SELECT * FROM folio_items WHERE folio_id = ?').all(targetRoomFolioId) as any[];
        const totals = FolioLedger.calculateTotals(allItems);

        sqlite.prepare(`
          UPDATE folios
          SET total_charges = ?, total_taxes = ?, total_payments = ?, total_discounts = ?, balance_due = ?, updated_at = ?
          WHERE id = ?
        `).run(totals.totalCharges, totals.totalTaxes, totals.totalPayments, totals.totalDiscounts, totals.balanceDue, now, targetRoomFolioId);
      });

      tx();

      syncEngine.recordOutboxEvent('FOLIO', targetRoomFolioId, 'UPDATE', { id: targetRoomFolioId, orderNumber, totalOrderAmount });
      broadcast('FOLIO_UPDATED', { folioId: targetRoomFolioId });
    }

    // 2. Print Kitchen Order Ticket (KOT)
    const kotBuffer = ReceiptTemplates.buildKitchenOrder({
      orderNumber,
      tableOrRoom: destinationType === 'ROOM_CHARGE' ? `Room ${roomNumber || 'Folio'}` : 'Bar Counter / Direct',
      serverName,
      timestamp: new Date().toLocaleTimeString(),
      items: items.map((i: any) => ({ name: i.name, quantity: i.quantity, notes: i.notes })),
    });

    const mockPrinter = new MockPrinterTransport();
    await mockPrinter.send(kotBuffer);

    broadcast('POS_ORDER_CREATED', { orderNumber, totalAmount: totalOrderAmount, destinationType });

    return reply.send({
      success: true,
      data: {
        orderNumber,
        totalAmount: totalOrderAmount,
        destinationType,
        kotReceiptBase64: kotBuffer.toString('base64'),
      },
    });
  });
}
