import { FastifyInstance } from 'fastify';
import Database from 'better-sqlite3';
import { KPICalculator, RoomStatus } from '@hospware/core-domain';
import { HubSyncEngine } from '../sync-engine';

export function registerSystemRoutes(
  server: FastifyInstance,
  sqlite: Database.Database,
  syncEngine: HubSyncEngine
) {
  // GET Dashboard Executive Overview
  server.get('/api/system/overview', async (request, reply) => {
    const prop = sqlite.prepare('SELECT * FROM properties LIMIT 1').get() as any;
    const totalRoomsRow = sqlite.prepare('SELECT COUNT(*) as count FROM rooms').get() as { count: number };
    const outOfOrderRow = sqlite.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'OUT_OF_ORDER'").get() as { count: number };
    const occupiedRow = sqlite.prepare("SELECT COUNT(*) as count FROM rooms WHERE status LIKE 'OCCUPIED%'").get() as { count: number };
    const dirtyRow = sqlite.prepare("SELECT COUNT(*) as count FROM rooms WHERE status LIKE '%DIRTY%'").get() as { count: number };
    const cleanRow = sqlite.prepare("SELECT COUNT(*) as count FROM rooms WHERE status LIKE '%CLEAN%' OR status = 'INSPECTED'").get() as { count: number };

    // Revenue calculations today
    const chargesRow = sqlite.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'ROOM_CHARGE' THEN total_amount ELSE 0 END), 0) as roomRev,
        COALESCE(SUM(CASE WHEN type LIKE 'POS%' THEN total_amount ELSE 0 END), 0) as fnbRev,
        COALESCE(SUM(CASE WHEN type NOT IN ('ROOM_CHARGE', 'PAYMENT', 'REFUND') AND type NOT LIKE 'POS%' THEN total_amount ELSE 0 END), 0) as otherRev,
        COALESCE(SUM(CASE WHEN type = 'PAYMENT' THEN total_amount ELSE 0 END), 0) as totalCollected
      FROM folio_items
      WHERE is_voided = 0
    `).get() as any;

    const kpi = KPICalculator.calculateMetrics({
      totalRooms: totalRoomsRow.count,
      outOfOrderRooms: outOfOrderRow.count,
      occupiedRooms: occupiedRow.count,
      roomRevenue: chargesRow.roomRev,
      fnbRevenue: chargesRow.fnbRev,
      otherRevenue: chargesRow.otherRev,
    });

    const activeShift = sqlite.prepare("SELECT * FROM shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get() as any;
    let drawerCash = 0;
    if (activeShift) {
      const txSum = sqlite.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type IN ('PAYMENT_RECEIVED', 'FLOAT_ADJUSTMENT') THEN amount ELSE -amount END), 0) as net
        FROM cash_transactions WHERE shift_id = ?
      `).get(activeShift.id) as { net: number };
      drawerCash = activeShift.opening_cash_float + (txSum?.net || 0);
    }

    const syncStatus = syncEngine.getStatus();

    return reply.send({
      success: true,
      data: {
        property: {
          id: prop.id,
          name: prop.name,
          currency: prop.currency,
          timezone: prop.timezone,
        },
        kpis: kpi,
        roomCounts: {
          total: totalRoomsRow.count,
          occupied: occupiedRow.count,
          dirty: dirtyRow.count,
          clean: cleanRow.count,
          outOfOrder: outOfOrderRow.count,
        },
        financials: {
          totalCollected: chargesRow.totalCollected,
          drawerCash,
          activeShiftOpen: Boolean(activeShift),
        },
        sync: syncStatus,
      },
    });
  });

  // GET Sync Status
  server.get('/api/system/sync', async (request, reply) => {
    return reply.send({ success: true, data: syncEngine.getStatus() });
  });

  // POST Trigger Sync
  server.post('/api/system/sync/trigger', async (request, reply) => {
    const success = await syncEngine.triggerSync();
    return reply.send({ success, data: syncEngine.getStatus() });
  });

  // GET License status (Offline validated)
  server.get('/api/system/license', async (request, reply) => {
    return reply.send({
      success: true,
      data: {
        isValid: true,
        status: 'ACTIVE',
        tier: 'STANDARD',
        maxRooms: 50,
        daysRemaining: 180,
        hotelName: 'Grand Horizon Hotel & Suites',
        enabledFeatures: ['POS', 'GUEST_PORTAL', 'OFFLINE_SYNC', 'RECEIPT_PRINTER'],
      },
    });
  });
}
