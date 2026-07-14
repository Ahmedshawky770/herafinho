import type { EventHandler } from '@herafino/contracts';

type AdminActionTakenConfig = {
  createAuditLog: (action: string, targetType: string, targetId: string, metadata?: Record<string, unknown>) => Promise<void>;
};

export class AdminActionTakenEventHandler implements EventHandler {
  constructor(private config: AdminActionTakenConfig) {}
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'admin.action_taken') {
      await this.config.createAuditLog(
        event.payload.action as string,
        event.payload.targetType as string,
        event.payload.targetId as string,
        event.payload.metadata as Record<string, unknown> | undefined
      );
    }
  }
}
