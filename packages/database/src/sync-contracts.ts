export interface SyncEntityRecord {
  id: string;
  entityType: 'PROPERTY' | 'ROOM_TYPE' | 'ROOM' | 'GUEST' | 'RESERVATION' | 'FOLIO' | 'FOLIO_ITEM' | 'SHIFT' | 'CASH_TX' | 'AUDIT_LOG';
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  sequenceNumber: number;
  clientTimestamp: string;
}

export interface SyncPushRequest {
  propertyId: string;
  tenantId: string;
  batchId: string;
  records: SyncEntityRecord[];
  clientVersion: string;
}

export interface SyncPushResponse {
  batchId: string;
  acceptedCount: number;
  failedCount: number;
  conflicts: {
    entityId: string;
    entityType: string;
    resolution: 'CLIENT_ACCEPTED' | 'SERVER_OVERRIDE' | 'MERGED';
    resolvedPayload?: Record<string, any>;
  }[];
  serverTimestamp: string;
}

export interface SyncPullRequest {
  propertyId: string;
  tenantId: string;
  lastSyncedTimestamp: string;
}

export interface SyncPullResponse {
  propertyId: string;
  records: SyncEntityRecord[];
  serverTimestamp: string;
  hasMore: boolean;
}
