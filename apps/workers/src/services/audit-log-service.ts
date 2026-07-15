import { logger } from '@herafino/shared';
import { AuditService } from '@herafino/shared/services';

/**
 * Thin adapter over the canonical {@link AuditService} from @herafino/shared.
 * Kept as a stable entry point for the worker so audit logging never blocks the
 * event pipeline: DB failures are swallowed and logged as warnings.
 */
export class AuditLogService {
  private readonly service = new AuditService();

  async createAuditLog(
    action: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.service.log({ action, targetType, targetId, metadata });
    } catch (err) {
      logger.warn(
        { action, targetType, targetId, error: err instanceof Error ? err.message : String(err) },
        'Audit log write failed (non-blocking)'
      );
    }
  }
}
