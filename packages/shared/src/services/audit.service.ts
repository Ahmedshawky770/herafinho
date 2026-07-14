import type { ID } from '@herafino/types';
import type { IAuditService, AuditLogEntry } from '@herafino/contracts';
import { eq } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { auditLogs } from '../db/schema';

export class AuditService implements IAuditService {
  async log(params: {
    actorId?: ID;
    action: string;
    targetType: string;
    targetId: ID;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const [row] = await db.insert(auditLogs).values({
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ?? {},
    }).returning();
    logger.info({ auditId: row.id, actorId: params.actorId, action: params.action, targetType: params.targetType, targetId: params.targetId }, 'Audit log recorded');
  }

  async findByActorId(actorId: ID, limit = 50): Promise<AuditLogEntry[]> {
    const rows = await db.query.auditLogs.findMany({
      where: eq(auditLogs.actorId, actorId),
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit,
    });
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId ?? '',
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
    }));
  }

  async findByTarget(targetType: string, targetId: ID): Promise<AuditLogEntry[]> {
    const rows = await db.query.auditLogs.findMany({
      where: eq(auditLogs.targetId, targetId),
      orderBy: (log, { desc }) => [desc(log.createdAt)],
    });
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId ?? '',
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
    }));
  }
}
