import type { ID } from '@herafino/types';

export interface IAuditService {
  log(params: {
    actorId?: ID;
    action: string;
    targetType: string;
    targetId: ID;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  findByActorId(actorId: ID, limit?: number): Promise<AuditLogEntry[]>;
  findByTarget(targetType: string, targetId: ID): Promise<AuditLogEntry[]>;
}

export interface AuditLogEntry {
  id: ID;
  actorId?: ID;
  action: string;
  targetType: string;
  targetId: ID;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
