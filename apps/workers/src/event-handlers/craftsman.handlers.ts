import type { EventHandler } from '@herafino/contracts';

type CraftsmanRegisteredConfig = {
  enqueueUserWelcomeEmail: (userId: string) => Promise<void>;
  enqueueAdminPendingNotification: () => Promise<void>;
};

export class CraftsmanRegisteredEventHandler implements EventHandler {
  constructor(private config: CraftsmanRegisteredConfig) {}

  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    if (event.name === 'craftsman.registered') {
      const userId = event.payload.userId as string;
      await this.config.enqueueUserWelcomeEmail(userId);
      await this.config.enqueueAdminPendingNotification();
    }
  }
}
