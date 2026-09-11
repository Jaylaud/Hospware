import Database from 'better-sqlite3';
import { SyncPushRequest, SyncPushResponse } from '@hospware/database';

export interface SyncStatus {
  isOnline: boolean;
  lastSuccessfulSyncAt: string | null;
  pendingOutboxCount: number;
  totalSyncedCount: number;
  isSyncing: boolean;
  cloudEndpoint: string;
}

export class HubSyncEngine {
  private sqlite: Database.Database;
  private cloudEndpoint: string;
  private propertyId: string;
  private tenantId: string;
  private isOnline: boolean = false;
  private isSyncing: boolean = false;
  private lastSuccessfulSyncAt: string | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(options: {
    sqlite: Database.Database;
    cloudEndpoint?: string;
    propertyId: string;
    tenantId: string;
  }) {
    this.sqlite = options.sqlite;
    this.cloudEndpoint = options.cloudEndpoint || process.env.CLOUD_API_URL || 'http://localhost:5001';
    this.propertyId = options.propertyId;
    this.tenantId = options.tenantId;
  }

  public start(intervalMs: number = 15000) {
    this.triggerSync();
    this.intervalTimer = setInterval(() => {
      this.triggerSync();
    }, intervalMs);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public getStatus(): SyncStatus {
    const outboxCountRow = this.sqlite
      .prepare('SELECT COUNT(*) as count FROM sync_outbox WHERE is_synced = 0')
      .get() as { count: number };

    const syncedCountRow = this.sqlite
      .prepare('SELECT COUNT(*) as count FROM sync_outbox WHERE is_synced = 1')
      .get() as { count: number };

    return {
      isOnline: this.isOnline,
      lastSuccessfulSyncAt: this.lastSuccessfulSyncAt,
      pendingOutboxCount: outboxCountRow.count,
      totalSyncedCount: syncedCountRow.count,
      isSyncing: this.isSyncing,
      cloudEndpoint: this.cloudEndpoint,
    };
  }

  /**
   * Records a local database mutation into sync_outbox
   */
  public recordOutboxEvent(
    entityType: string,
    entityId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>
  ) {
    const now = new Date().toISOString();
    const id = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const seqRow = this.sqlite
      .prepare('SELECT COALESCE(MAX(sequence_number), 0) + 1 as nextSeq FROM sync_outbox')
      .get() as { nextSeq: number };

    this.sqlite.prepare(`
      INSERT INTO sync_outbox (id, property_id, entity_type, entity_id, operation, payload_json, sequence_number, is_synced, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, this.propertyId, entityType, entityId, operation, JSON.stringify(payload), seqRow.nextSeq, now);
  }

  public async triggerSync(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;

    try {
      // 1. Health check / Ping cloud
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const pingRes = await fetch(`${this.cloudEndpoint}/api/health`, {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (!pingRes || !pingRes.ok) {
        this.isOnline = false;
        this.isSyncing = false;
        return false;
      }

      this.isOnline = true;

      // 2. Fetch un-synced outbox items (up to 100 per batch)
      const pendingRows = this.sqlite.prepare(`
        SELECT id, property_id, entity_type, entity_id, operation, payload_json, sequence_number, created_at
        FROM sync_outbox
        WHERE is_synced = 0
        ORDER BY sequence_number ASC
        LIMIT 100
      `).all() as any[];

      if (pendingRows.length > 0) {
        const batchId = `batch-${Date.now()}`;
        const syncRequest: SyncPushRequest = {
          tenantId: this.tenantId,
          propertyId: this.propertyId,
          batchId,
          clientVersion: '1.0.0',
          records: pendingRows.map((r) => ({
            id: r.id,
            entityType: r.entity_type,
            entityId: r.entity_id,
            operation: r.operation,
            payload: JSON.parse(r.payload_json),
            sequenceNumber: r.sequence_number,
            clientTimestamp: r.created_at,
          })),
        };

        const pushRes = await fetch(`${this.cloudEndpoint}/api/sync/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncRequest),
        });

        if (pushRes.ok) {
          const pushData = (await pushRes.json()) as SyncPushResponse;
          const now = new Date().toISOString();

          // Mark batch as synced
          const markSyncedStmt = this.sqlite.prepare(`
            UPDATE sync_outbox
            SET is_synced = 1, synced_at = ?
            WHERE id = ?
          `);

          const transaction = this.sqlite.transaction((rows: any[]) => {
            for (const r of rows) {
              markSyncedStmt.run(now, r.id);
            }
          });

          transaction(pendingRows);
          this.lastSuccessfulSyncAt = now;
        }
      }

      this.isSyncing = false;
      return true;
    } catch {
      this.isOnline = false;
      this.isSyncing = false;
      return false;
    }
  }
}
