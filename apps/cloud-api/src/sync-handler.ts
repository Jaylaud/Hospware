import { SyncPushRequest, SyncPushResponse, SyncPullRequest, SyncPullResponse } from '@hospware/database';

export class CloudSyncService {
  // In-memory sync store for demo/standalone SaaS mode (or Postgres via Drizzle)
  private static syncInbox: Map<string, any[]> = new Map();

  public static handlePush(request: SyncPushRequest): SyncPushResponse {
    const { tenantId, propertyId, batchId, records } = request;
    const serverTimestamp = new Date().toISOString();

    const existing = this.syncInbox.get(propertyId) || [];
    this.syncInbox.set(propertyId, [...existing, ...records.map((r) => ({ ...r, batchId, receivedAt: serverTimestamp }))]);

    return {
      batchId,
      acceptedCount: records.length,
      failedCount: 0,
      conflicts: [],
      serverTimestamp,
    };
  }

  public static handlePull(propertyId: string, lastSyncedTimestamp?: string): SyncPullResponse {
    const serverTimestamp = new Date().toISOString();
    const stored = this.syncInbox.get(propertyId) || [];

    const newRecords = lastSyncedTimestamp
      ? stored.filter((r) => new Date(r.receivedAt).getTime() > new Date(lastSyncedTimestamp).getTime())
      : stored;

    return {
      propertyId,
      records: newRecords,
      serverTimestamp,
      hasMore: false,
    };
  }
}
