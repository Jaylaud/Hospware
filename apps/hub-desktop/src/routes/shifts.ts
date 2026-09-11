import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { ShiftReconciliation } from '@hospware/core-domain';
import { generateUUIDv7 } from '@hospware/database';
import { ReceiptTemplates, MockPrinterTransport } from '@hospware/escpos-printer';
import { HubSyncEngine } from '../sync-engine';

export function registerShiftRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine,
  broadcast: (event: string, data: any) => void
) {
  // GET active shift
  server.get('/api/shifts/active', async (request, reply) => {
    const shift = sqlite.prepare(`
      SELECT s.*, u.full_name as user_name, u.role
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'OPEN'
      ORDER BY s.opened_at DESC
      LIMIT 1
    `).get() as any;

    if (!shift) {
      return reply.send({ success: true, activeShift: null });
    }

    const transactions = sqlite.prepare(`
      SELECT * FROM cash_transactions WHERE shift_id = ? ORDER BY created_at ASC
    `).all(shift.id) as any[];

    const expectedData = ShiftReconciliation.calculateExpectedCash(
      shift.opening_cash_float,
      transactions.map((t) => ({
        id: t.id,
        shiftId: t.shift_id,
        propertyId: t.property_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        authorizedByUserId: t.authorized_by_user_id,
        createdAt: t.created_at,
      }))
    );

    return reply.send({
      success: true,
      activeShift: {
        ...shift,
        transactions,
        totalCashReceived: expectedData.totalReceived,
        totalCashPayouts: expectedData.totalPayouts,
        expectedClosingCash: expectedData.expectedCash,
      },
    });
  });

  // POST Open new shift
  server.post('/api/shifts/open', async (request: any, reply) => {
    const { userId = 'usr-2', openingCashFloat = 100.0 } = request.body;
    const property = sqlite.prepare('SELECT id FROM properties LIMIT 1').get() as any;

    // Check if open shift exists
    const existing = sqlite.prepare("SELECT id FROM shifts WHERE status = 'OPEN'").get();
    if (existing) {
      return reply.status(400).send({ success: false, error: 'A shift is already open. Please close the current shift first.' });
    }

    const shiftId = generateUUIDv7();
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO shifts (id, property_id, user_id, opened_at, opening_cash_float, expected_closing_cash, status, audit_flagged)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN', 0)
    `).run(shiftId, property.id, userId, now, openingCashFloat, openingCashFloat);

    syncEngine.recordOutboxEvent('SHIFT', shiftId, 'INSERT', { id: shiftId, userId, openedAt: now, openingCashFloat });
    broadcast('SHIFT_OPENED', { shiftId, openedAt: now, openingCashFloat });

    return reply.send({ success: true, data: { shiftId, openedAt: now, openingCashFloat } });
  });

  // POST Cash payout / expense from drawer
  server.post('/api/shifts/payout', async (request: any, reply) => {
    const { shiftId, amount, description, userId = 'usr-2' } = request.body;
    const shift = sqlite.prepare("SELECT * FROM shifts WHERE id = ? AND status = 'OPEN'").get(shiftId) as any;
    if (!shift) {
      return reply.status(404).send({ success: false, error: 'Active shift not found' });
    }

    const txId = generateUUIDv7();
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO cash_transactions (id, shift_id, property_id, type, amount, description, authorized_by_user_id, created_at)
      VALUES (?, ?, ?, 'PAYOUT_EXPENSE', ?, ?, ?, ?)
    `).run(txId, shiftId, shift.property_id, amount, description, userId, now);

    syncEngine.recordOutboxEvent('CASH_TX', txId, 'INSERT', { id: txId, shiftId, amount, description });
    broadcast('SHIFT_UPDATED', { shiftId });

    return reply.send({ success: true, data: { txId, amount, description } });
  });

  // POST Blind Cash Drop and Shift Close
  server.post('/api/shifts/blind-drop', async (request: any, reply) => {
    const { shiftId, actualCountedCash, varianceReason, userId = 'usr-2' } = request.body;

    const shift = sqlite.prepare("SELECT s.*, u.full_name as user_name FROM shifts s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.status = 'OPEN'").get(shiftId) as any;
    if (!shift) {
      return reply.status(404).send({ success: false, error: 'Active shift not found' });
    }

    const transactions = sqlite.prepare('SELECT * FROM cash_transactions WHERE shift_id = ?').all(shiftId) as any[];

    const closingResult = ShiftReconciliation.processBlindDrop({
      openingFloat: shift.opening_cash_float,
      transactions: transactions.map((t) => ({
        id: t.id,
        shiftId: t.shift_id,
        propertyId: t.property_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        authorizedByUserId: t.authorized_by_user_id,
        createdAt: t.created_at,
      })),
      actualCountedCash,
      varianceThreshold: 5.0, // Alert owner if discrepancy > $5
    });

    const now = new Date().toISOString();

    sqlite.prepare(`
      UPDATE shifts
      SET closed_at = ?, expected_closing_cash = ?, actual_blind_drop_cash = ?, cash_variance = ?, variance_reason = ?, status = 'CLOSED', audit_flagged = ?
      WHERE id = ?
    `).run(
      now,
      closingResult.expectedClosingCash,
      closingResult.actualBlindDropCash,
      closingResult.cashVariance,
      varianceReason || null,
      closingResult.isAuditFlagged ? 1 : 0,
      shiftId
    );

    if (closingResult.isAuditFlagged) {
      sqlite.prepare(`
        INSERT INTO audit_logs (id, property_id, user_id, action, severity, metadata_json, created_at)
        VALUES (?, ?, ?, 'SHIFT_VARIANCE', 'WARNING', ?, ?)
      `).run(
        `audit-${Date.now()}`,
        shift.property_id,
        userId,
        JSON.stringify({ shiftId, expected: closingResult.expectedClosingCash, actual: closingResult.actualBlindDropCash, variance: closingResult.cashVariance, reason: varianceReason }),
        now
      );
    }

    syncEngine.recordOutboxEvent('SHIFT', shiftId, 'UPDATE', { id: shiftId, closedAt: now, variance: closingResult.cashVariance, auditFlagged: closingResult.isAuditFlagged });

    // Print Shift Report
    const prop = sqlite.prepare('SELECT * FROM properties LIMIT 1').get() as any;
    const reportBuffer = ReceiptTemplates.buildShiftReport({
      header: { hotelName: prop.name },
      shiftId,
      cashierName: shift.user_name,
      openedAt: shift.opened_at,
      closedAt: now,
      currency: prop.currency,
      openingFloat: closingResult.openingCashFloat,
      totalCashReceived: closingResult.totalCashReceived,
      totalCashPayouts: closingResult.totalCashPayouts,
      expectedCash: closingResult.expectedClosingCash,
      actualBlindDrop: closingResult.actualBlindDropCash,
      variance: closingResult.cashVariance,
      status: closingResult.status,
      paymentSummary: [{ method: 'Cash Drawer', amount: closingResult.actualBlindDropCash }],
    });

    const mockPrinter = new MockPrinterTransport();
    await mockPrinter.send(reportBuffer);

    broadcast('SHIFT_CLOSED', { shiftId, closingResult });

    return reply.send({
      success: true,
      data: {
        shiftId,
        closingResult,
        receiptBase64: reportBuffer.toString('base64'),
      },
    });
  });
}
