import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { ReservationStatus, RoomStatus, FolioItemType, PaymentMethod } from '@hospware/core-domain';
import { generateUUIDv7 } from '@hospware/database';
import { HubSyncEngine } from '../sync-engine';

export function registerReservationRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine,
  broadcast: (event: string, data: any) => void
) {
  // GET reservations
  server.get('/api/reservations', async (request, reply) => {
    const reservations = sqlite.prepare(`
      SELECT 
        res.*,
        g.first_name, g.last_name, g.phone, g.email, g.vip_status,
        r.room_number,
        rt.name as room_type_name, rt.code as room_type_code
      FROM reservations res
      JOIN guests g ON res.guest_id = g.id
      JOIN room_types rt ON res.room_type_id = rt.id
      LEFT JOIN rooms r ON res.room_id = r.id
      ORDER BY res.created_at DESC
    `).all() as any[];

    const formatted = reservations.map((r) => ({
      id: r.id,
      propertyId: r.property_id,
      guest: {
        id: r.guest_id,
        firstName: r.first_name,
        lastName: r.last_name,
        phone: r.phone,
        email: r.email,
        vipStatus: Boolean(r.vip_status),
      },
      room: r.room_id ? { id: r.room_id, roomNumber: r.room_number } : null,
      roomType: { id: r.room_type_id, name: r.room_type_name, code: r.room_type_code },
      status: r.status,
      checkInDate: r.check_in_date,
      checkOutDate: r.check_out_date,
      adultsCount: r.adults_count,
      childrenCount: r.children_count,
      nightlyRate: r.nightly_rate,
      totalEstimatedAmount: r.total_estimated_amount,
      depositPaid: r.deposit_paid,
      source: r.source,
      sourceReference: r.source_reference,
      notes: r.notes,
      checkedInAt: r.checked_in_at,
      checkedOutAt: r.checked_out_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return reply.send({ success: true, data: formatted });
  });

  // POST Rapid Walk-in Check-in
  server.post('/api/checkin/walk-in', async (request: any, reply) => {
    const {
      guestFirstName,
      guestLastName,
      guestPhone,
      guestEmail,
      guestIdNumber,
      roomId,
      checkInDate,
      checkOutDate,
      nightlyRate,
      depositAmount = 0,
      paymentMethod = PaymentMethod.CASH,
      paymentReference,
      adultsCount = 1,
      childrenCount = 0,
      notes,
      userId = 'usr-2',
    } = request.body;

    const property = sqlite.prepare('SELECT * FROM properties LIMIT 1').get() as any;
    const room = sqlite.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;

    if (!room) {
      return reply.status(404).send({ success: false, error: 'Room not found' });
    }

    const now = new Date().toISOString();
    const guestId = generateUUIDv7();
    const resId = generateUUIDv7();
    const folioId = generateUUIDv7();

    // Calculate nights
    const d1 = new Date(checkInDate).getTime();
    const d2 = new Date(checkOutDate).getTime();
    const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const totalEstimatedAmount = nightlyRate * nights;

    const tx = sqlite.transaction(() => {
      // 1. Create Guest
      sqlite.prepare(`
        INSERT INTO guests (id, property_id, first_name, last_name, phone, email, id_document_number, vip_status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(guestId, property.id, guestFirstName, guestLastName, guestPhone, guestEmail || null, guestIdNumber || null, notes || null, now, now);

      // 2. Create Reservation
      sqlite.prepare(`
        INSERT INTO reservations (id, property_id, guest_id, room_id, room_type_id, status, check_in_date, check_out_date, adults_count, children_count, nightly_rate, total_estimated_amount, deposit_paid, source, notes, checked_in_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'CHECKED_IN', ?, ?, ?, ?, ?, ?, ?, 'WALK_IN', ?, ?, ?, ?)
      `).run(resId, property.id, guestId, roomId, room.room_type_id, checkInDate, checkOutDate, adultsCount, childrenCount, nightlyRate, totalEstimatedAmount, depositAmount, notes || null, now, now, now);

      // 3. Update Room Status to OCCUPIED_CLEAN
      sqlite.prepare(`
        UPDATE rooms
        SET status = 'OCCUPIED_CLEAN', current_reservation_id = ?, updated_at = ?
        WHERE id = ?
      `).run(resId, now, roomId);

      // 4. Create Folio
      sqlite.prepare(`
        INSERT INTO folios (id, property_id, reservation_id, guest_id, currency, status, total_charges, total_taxes, total_payments, total_discounts, balance_due, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'OPEN', ?, 0, ?, 0, ?, ?, ?)
      `).run(folioId, property.id, resId, guestId, property.currency, totalEstimatedAmount, depositAmount, totalEstimatedAmount - depositAmount, now, now);

      // 5. Add Room Charge to Folio Items
      const roomChargeItemId = generateUUIDv7();
      sqlite.prepare(`
        INSERT INTO folio_items (id, folio_id, type, description, quantity, unit_price, total_amount, tax_amount, created_by_user_id, is_voided, created_at)
        VALUES (?, ?, 'ROOM_CHARGE', ?, ?, ?, ?, 0, ?, 0, ?)
      `).run(roomChargeItemId, folioId, `Room ${room.room_number} (${nights} nights @ ${nightlyRate})`, nights, nightlyRate, totalEstimatedAmount, userId, now);

      // 6. Add Payment if deposit paid
      if (depositAmount > 0) {
        const paymentItemId = generateUUIDv7();
        sqlite.prepare(`
          INSERT INTO folio_items (id, folio_id, type, description, quantity, unit_price, total_amount, tax_amount, payment_method, payment_reference, created_by_user_id, is_voided, created_at)
          VALUES (?, ?, 'PAYMENT', ?, 1, ?, ?, 0, ?, ?, ?, 0, ?)
        `).run(paymentItemId, folioId, `Initial Deposit (${paymentMethod})`, depositAmount, depositAmount, paymentMethod, paymentReference || null, userId, now);

        // Record in cash transaction if Cash payment
        if (paymentMethod === PaymentMethod.CASH) {
          const activeShift = sqlite.prepare("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get() as any;
          if (activeShift) {
            sqlite.prepare(`
              INSERT INTO cash_transactions (id, shift_id, property_id, type, amount, description, related_folio_id, authorized_by_user_id, created_at)
              VALUES (?, ?, ?, 'PAYMENT_RECEIVED', ?, ?, ?, ?, ?)
            `).run(generateUUIDv7(), activeShift.id, property.id, depositAmount, `Walk-in deposit for Room ${room.room_number}`, folioId, userId, now);
          }
        }
      }
    });

    tx();

    // Outbox events for sync
    syncEngine.recordOutboxEvent('RESERVATION', resId, 'INSERT', { id: resId, roomId, guestFirstName, guestLastName, checkInDate, checkOutDate, totalEstimatedAmount });
    syncEngine.recordOutboxEvent('ROOM', roomId, 'UPDATE', { id: roomId, status: 'OCCUPIED_CLEAN', currentReservationId: resId });

    // Real-time broadcast
    broadcast('RESERVATION_CREATED', { reservationId: resId, roomId, roomNumber: room.room_number, guestName: `${guestFirstName} ${guestLastName}` });
    broadcast('ROOM_STATUS_CHANGED', { id: roomId, roomNumber: room.room_number, status: 'OCCUPIED_CLEAN' });

    return reply.send({
      success: true,
      data: {
        reservationId: resId,
        folioId,
        guestId,
        roomNumber: room.room_number,
        checkInDate,
        checkOutDate,
        totalAmount: totalEstimatedAmount,
        depositPaid: depositAmount,
      },
    });
  });

  // POST Checkout & Settle Folio
  server.post('/api/checkout/:reservationId', async (request: any, reply) => {
    const { reservationId } = request.params;
    const { userId = 'usr-2' } = request.body || {};

    const res = sqlite.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as any;
    if (!res) {
      return reply.status(404).send({ success: false, error: 'Reservation not found' });
    }

    const folio = sqlite.prepare('SELECT * FROM folios WHERE reservation_id = ?').get(reservationId) as any;
    if (folio && folio.balance_due > 0.01) {
      return reply.status(400).send({
        success: false,
        error: `Cannot checkout: Outstanding balance due of ${folio.currency} ${folio.balance_due.toFixed(2)}. Please settle folio first.`,
      });
    }

    const now = new Date().toISOString();
    const tx = sqlite.transaction(() => {
      // 1. Mark reservation checked out
      sqlite.prepare(`
        UPDATE reservations
        SET status = 'CHECKED_OUT', checked_out_at = ?, updated_at = ?
        WHERE id = ?
      `).run(now, now, reservationId);

      // 2. Mark folio closed
      if (folio) {
        sqlite.prepare(`
          UPDATE folios
          SET status = 'CLOSED', updated_at = ?
          WHERE id = ?
        `).run(now, folio.id);
      }

      // 3. Mark room as VACANT_DIRTY for housekeeping
      if (res.room_id) {
        sqlite.prepare(`
          UPDATE rooms
          SET status = 'VACANT_DIRTY', current_reservation_id = NULL, cleaning_priority = 1, updated_at = ?
          WHERE id = ?
        `).run(now, res.room_id);
      }
    });

    tx();

    if (res.room_id) {
      syncEngine.recordOutboxEvent('ROOM', res.room_id, 'UPDATE', { id: res.room_id, status: 'VACANT_DIRTY' });
      broadcast('ROOM_STATUS_CHANGED', { id: res.room_id, status: 'VACANT_DIRTY', cleaningPriority: 1 });
    }

    broadcast('RESERVATION_CHECKED_OUT', { reservationId, roomId: res.room_id });

    return reply.send({ success: true, message: 'Reservation checked out successfully' });
  });
}
