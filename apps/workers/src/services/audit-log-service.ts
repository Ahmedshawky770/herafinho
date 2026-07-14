import { logger } from '@herafino/shared';

export class AuditLogService {
  async createAuditLog(
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const { db } = await import('@/lib/db');
      const { auditLogs } = await import('@/lib/db/schema');

      await db.insert(auditLogs).values({
        action,
        targetType,
        targetId,
        metadata: metadata ?? {},
      });
    } catch (err) {
      logger.warn(
        { action, targetType, targetId, error: err instanceof Error ? err.message : String(err) },
        'Audit log write failed (non-blocking)'
      );
    }
  }
}
